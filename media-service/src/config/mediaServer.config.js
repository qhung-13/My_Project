import NodeMediaServer from "node-media-server";
import { mkdirSync, writeFileSync } from "fs";
import { rm } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { startHlsUploader } from "../services/hlsUploader.service.js";
import {
  getStreamKeyOwner,
  startStreamKeyRegistry,
  stopStreamKeyRegistry,
} from "../services/streamKeyRegistry.service.js";
import { extractStreamKey } from "../utils/streamPath.js";
import {
  releasePublisherReservation,
  tryReservePublisher,
} from "../utils/publisherReservation.js";

const ffmpegProcesses = new Map(); // streamPath -> ChildProcess
const activeStreams = new Map(); // streamPath -> { streamKey, playbackId }
const publisherSessions = new Map(); // streamPath -> NMS session/id
const reservedPublishPaths = new Map(); // streamPath -> authorized publisher session
const forcedTerminationPaths = new Set();
const hlsCleanupTimers = new Map(); // playbackId -> timer

const HLS_CLEANUP_DELAY_MS = Number(process.env.HLS_CLEANUP_DELAY_MS || 15_000);
const STREAM_AUTH_SWEEP_INTERVAL_MS = Number(
  process.env.STREAM_AUTH_SWEEP_INTERVAL_MS || 2_000,
);
const MEDIA_HEARTBEAT_INTERVAL_MS = Number(
  process.env.MEDIA_HEARTBEAT_INTERVAL_MS || 5_000,
);
const MEDIA_ROOT = path.resolve("./media");
const HTTP_PORT = Number(process.env.MEDIA_HTTP_PORT || 8000);
const RTMP_PORT = Number(process.env.MEDIA_RTMP_PORT || 1935);
const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

const getHlsFolderPath = (playbackId) =>
  path.join(MEDIA_ROOT, "live", playbackId);

const cancelScheduledCleanup = (playbackId) => {
  const timer = hlsCleanupTimers.get(playbackId);
  if (!timer) return;
  clearTimeout(timer);
  hlsCleanupTimers.delete(playbackId);
};

const removeHlsFolder = async (playbackId) => {
  if (!playbackId) return;
  const folderPath = getHlsFolderPath(playbackId);
  await rm(folderPath, { recursive: true, force: true });
  console.log(`[media-service] Removed HLS folder: ${folderPath}`);
};

const scheduleHlsCleanup = (playbackId) => {
  if (!playbackId) return;
  cancelScheduledCleanup(playbackId);

  const timer = setTimeout(() => {
    hlsCleanupTimers.delete(playbackId);
    void removeHlsFolder(playbackId).catch((error) => {
      console.error(
        `[media-service] Failed to clean HLS folder for ${playbackId}:`,
        error.message,
      );
    });
  }, HLS_CLEANUP_DELAY_MS);

  timer.unref?.();
  hlsCleanupTimers.set(playbackId, timer);
};

const notifyBackend = async (event, streamKey, extraBody = {}) => {
  const response = await fetch(
    `${BACKEND_INTERNAL_URL}/streams/internal/${event}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-media-service-secret": process.env.MEDIA_SERVICE_SECRET,
      },
      body: JSON.stringify({ streamKey, ...extraBody }),
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload.message || `Backend returned HTTP ${response.status}`,
    );
  }

  return response.json();
};

const config = {
  logType: 3,
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: HTTP_PORT,
    mediaroot: MEDIA_ROOT,
    allow_origin: "*",
  },
  // NodeMediaServer v4 performs this check synchronously inside
  // BroadcastServer.postPublish *before* assigning the publisher. This is the
  // hard gate that prevents arbitrary/guessed RTMP paths from briefly owning a
  // broadcast. The per-user registry below remains the revocation layer.
  auth: {
    publish: true,
    secret: process.env.MEDIA_PUBLISH_AUTH_SECRET,
  },
};

const configureMediaServer = async () => {
  // NodeMediaServer v4 event callbacks are synchronous, but `prePublish` is a
  // notification hook rather than a cancellable authorization hook. The hard
  // publish gate is NMS native signed publish auth (config.auth.publish); this
  // in-memory registry is the per-user authorization/revocation layer and must
  // therefore stay synchronous inside the event callbacks.
  await startStreamKeyRegistry();

  const nms = new NodeMediaServer(config);
  nms.run();

  const closeSession = (session, reason) => {
    if (session && typeof session.close === "function") {
      console.warn(`[media-service] Closing RTMP session: ${reason}`);
      session.close();
      return true;
    }

    console.error(
      `[media-service] Could not close RTMP session (${reason}); session.close() is unavailable`,
    );
    return false;
  };

  startHlsUploader(path.join(MEDIA_ROOT, "live"));

  // Defense in depth for bans/key revocation: even if the backend control-plane
  // request cannot reach this process, the registry refresh removes the old
  // key and this sweep closes any publisher that is no longer authorized.
  const authorizationSweep = setInterval(() => {
    for (const [streamPath, sessionRef] of reservedPublishPaths) {
      const streamKey = extractStreamKey(streamPath);
      if (streamKey && getStreamKeyOwner(streamKey)) continue;
      closeSession(sessionRef, "stream credential was revoked");
    }
  }, STREAM_AUTH_SWEEP_INTERVAL_MS);
  authorizationSweep.unref?.();

  let heartbeatInFlight = false;

  const mediaHeartbeatTimer = setInterval(() => {
    if (heartbeatInFlight || activeStreams.size === 0) {
      return;
    }

    heartbeatInFlight = true;
    
    const streams = Array.from(activeStreams.values());

    void Promise.allSettled(
      streams.map(({ streamKey, playbackId }) =>
        notifyBackend("heartbeat", streamKey, {
          playbackId,
        }),
      ),
    )
      .then((results) => {
        const failed = results.filter((result) => result.status === "rejected");

        if (failed.length > 0) {
          console.warn(
            `[media-service] ${failed.length}/${results.length} stream heartbeat(s) failed`,
          );
        }
      })
      .finally(() => {
        heartbeatInFlight = false;
      });
  }, MEDIA_HEARTBEAT_INTERVAL_MS);

  mediaHeartbeatTimer.unref?.();

  const stopFfmpeg = (streamPath) => {
    const ffmpeg = ffmpegProcesses.get(streamPath);
    if (!ffmpeg) return;
    ffmpegProcesses.delete(streamPath);
    if (!ffmpeg.killed) ffmpeg.kill("SIGTERM");
  };

  const releaseReservation = (streamPath, sessionRef) => {
    releasePublisherReservation(reservedPublishPaths, streamPath, sessionRef);
    if (publisherSessions.get(streamPath) === sessionRef) {
      publisherSessions.delete(streamPath);
    }
  };

  const startTranscode = async (streamPath, streamKey, sessionRef) => {
    let backendPayload;
    try {
      backendPayload = await notifyBackend("publish", streamKey);
    } catch (error) {
      console.error(
        `[media-service] Could not register live stream: ${error.message}`,
      );
      releaseReservation(streamPath, sessionRef);
      closeSession(sessionRef, "backend rejected publish");
      return;
    }

    const playbackId = String(backendPayload?.playbackId || "").trim();
    if (!/^[a-zA-Z0-9-]{16,128}$/.test(playbackId)) {
      console.error("[media-service] Backend returned an invalid playbackId");
      releaseReservation(streamPath, sessionRef);
      closeSession(sessionRef, "invalid playback id");
      await notifyBackend("unpublish", streamKey).catch(() => {});
      return;
    }

    // OBS may have disconnected while the backend call was in flight.
    if (
      reservedPublishPaths.get(streamPath) !== sessionRef ||
      forcedTerminationPaths.has(streamPath)
    ) {
      if (!forcedTerminationPaths.has(streamPath)) {
        await notifyBackend("unpublish", streamKey).catch(() => {});
      }
      scheduleHlsCleanup(playbackId);
      return;
    }

    activeStreams.set(streamPath, { streamKey, playbackId });
    cancelScheduledCleanup(playbackId);

    const folderPath = getHlsFolderPath(playbackId);
    try {
      await removeHlsFolder(playbackId);
      mkdirSync(path.join(folderPath, "1080p"), { recursive: true });
      mkdirSync(path.join(folderPath, "720p"), { recursive: true });
      mkdirSync(path.join(folderPath, "480p"), { recursive: true });
    } catch (error) {
      console.error(
        `[media-service] Failed to prepare HLS files for ${playbackId}:`,
        error.message,
      );
      activeStreams.delete(streamPath);
      releaseReservation(streamPath, sessionRef);
      closeSession(sessionRef, "HLS directory setup failed");
      await notifyBackend("unpublish", streamKey).catch(() => {});
      return;
    }

    const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080,CODECS="avc1.64002A,mp4a.40.2"
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,CODECS="avc1.640020,mp4a.40.2"
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1096000,RESOLUTION=854x480,CODECS="avc1.64001F,mp4a.40.2"
480p/index.m3u8`;

    writeFileSync(path.join(folderPath, "index.m3u8"), masterPlaylist);
    console.log(
      "Master playlist created at:",
      path.join(folderPath, "index.m3u8"),
    );

    stopFfmpeg(streamPath);

    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-i",
      `rtmp://localhost:${RTMP_PORT}${streamPath}`,

      // 1080p
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-b:v",
      "5000k",
      "-s",
      "1920x1080",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "3",
      "-hls_flags",
      "delete_segments+independent_segments",
      path.join(folderPath, "1080p/index.m3u8"),

      // 720p
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-b:v",
      "2500k",
      "-s",
      "1280x720",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "3",
      "-hls_flags",
      "delete_segments+independent_segments",
      path.join(folderPath, "720p/index.m3u8"),

      // 480p
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-b:v",
      "1000k",
      "-s",
      "854x480",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "3",
      "-hls_flags",
      "delete_segments+independent_segments",
      path.join(folderPath, "480p/index.m3u8"),
    ]);

    ffmpeg.stderr.on("data", (data) => {
      const message = data.toString().trim();
      if (message) console.warn(`[ffmpeg ${playbackId}]`, message);
    });

    ffmpeg.on("error", (error) => {
      console.error(`[ffmpeg ${playbackId}] failed to start:`, error.message);
      ffmpegProcesses.delete(streamPath);
      closeSession(sessionRef, "ffmpeg failed to start");
    });

    ffmpeg.on("close", (code, signal) => {
      console.log("ffmpeg closed:", { playbackId, code, signal });
      if (ffmpegProcesses.get(streamPath) === ffmpeg) {
        ffmpegProcesses.delete(streamPath);
      }

      if (
        typeof code === "number" &&
        code !== 0 &&
        !forcedTerminationPaths.has(streamPath)
      ) {
        // Stop ingest as well. `donePublish` owns the single backend
        // unpublish transition, avoiding duplicate/racing state changes.
        closeSession(sessionRef, "ffmpeg exited unexpectedly");
      }
    });

    ffmpegProcesses.set(streamPath, ffmpeg);
    console.log("ffmpeg started for:", streamPath, "->", playbackId);
  };

  nms.on("prePublish", (session) => {
    const streamPath = session?.streamPath;
    const streamKey = extractStreamKey(streamPath);

    // NodeMediaServer v4 emits prePublish *before* its native signature check.
    // Never reserve a path here: a client with an unsigned/expired credential
    // could otherwise leave an application-level reservation behind even
    // though NMS rejects the publish immediately afterwards.
    if (!streamPath || !streamKey) {
      closeSession(session, "malformed stream path");
      return;
    }

    if (!getStreamKeyOwner(streamKey)) {
      console.warn("[media-service] Invalid or inactive stream key");
      closeSession(session, "invalid stream key");
    }
  });

  nms.on("postPublish", (session) => {
    const streamPath = session?.streamPath;
    const streamKey = extractStreamKey(streamPath);
    if (!streamPath || !streamKey) {
      closeSession(session, "publish path was malformed");
      return;
    }

    // postPublish is emitted only after NMS native publish authentication has
    // succeeded. Re-check the live registry here so a signed credential that
    // was revoked/rotated cannot start transcoding.
    const owner = getStreamKeyOwner(streamKey);
    if (!owner) {
      closeSession(session, "stream credential is no longer active");
      return;
    }

    // NMS emits postPublish before it performs its own duplicate-publisher
    // assignment check. Track the exact session object so a second publisher
    // can never piggyback on the first publisher's reservation.
    if (!tryReservePublisher(reservedPublishPaths, streamPath, session)) {
      closeSession(session, "duplicate publisher");
      return;
    }
    publisherSessions.set(streamPath, session);
    console.log(`Valid signed stream credential for user: ${owner.username}`);
    void startTranscode(streamPath, streamKey, session);
  });

  nms.on("donePublish", (session) => {
    const streamPath = session?.streamPath;
    const streamKey = extractStreamKey(streamPath);
    const active = activeStreams.get(streamPath);
    const forced = forcedTerminationPaths.has(streamPath);

    releaseReservation(streamPath, session);
    forcedTerminationPaths.delete(streamPath);
    stopFfmpeg(streamPath);
    activeStreams.delete(streamPath);

    if (active?.playbackId) scheduleHlsCleanup(active.playbackId);

    if (!streamKey || forced) return;

    void notifyBackend("unpublish", streamKey).catch((error) => {
      console.error(
        "[media-service] Failed to mark stream offline:",
        error.message,
      );
    });
  });

  const terminateByStreamKey = async (streamKey) => {
    const streamPath = `/live/${streamKey}`;
    const hadPublisher =
      reservedPublishPaths.has(streamPath) || activeStreams.has(streamPath);
    const active = activeStreams.get(streamPath);

    forcedTerminationPaths.add(streamPath);
    reservedPublishPaths.delete(streamPath);
    stopFfmpeg(streamPath);
    if (active?.playbackId) scheduleHlsCleanup(active.playbackId);

    const sessionRef = publisherSessions.get(streamPath);
    const closed = sessionRef
      ? closeSession(sessionRef, "terminated by backend control plane")
      : false;

    if (!hadPublisher) forcedTerminationPaths.delete(streamPath);

    return {
      terminated: hadPublisher,
      sessionClosed: closed,
      playbackId: active?.playbackId || null,
    };
  };

  console.log(
    `[media-service] RTMP ingest on :${RTMP_PORT}, NMS HTTP on :${HTTP_PORT}`,
  );

  return {
    terminateByStreamKey,
    stop: async () => {
      for (const process of ffmpegProcesses.values()) {
        if (!process.killed) process.kill("SIGTERM");
      }
      ffmpegProcesses.clear();

      clearInterval(authorizationSweep);
      clearInterval(mediaHeartbeatTimer);

      for (const timer of hlsCleanupTimers.values()) clearTimeout(timer);
      hlsCleanupTimers.clear();
      activeStreams.clear();
      publisherSessions.clear();
      reservedPublishPaths.clear();
      forcedTerminationPaths.clear();

      await stopStreamKeyRegistry();
      nms.stop?.();
    },
  };
};

export default configureMediaServer;
