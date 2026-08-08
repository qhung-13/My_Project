import NodeMediaServer from "node-media-server";
import { mkdirSync, writeFileSync } from "fs";
import { rm } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import User from "../model/User.model.js";
import { startHlsUploader } from "../services/hlsUploader.service.js";
import { extractStreamKey } from "../utils/streamPath.js";

const ffmpegProcesses = new Map();
const hlsCleanupTimers = new Map();
const HLS_CLEANUP_DELAY_MS = Number(process.env.HLS_CLEANUP_DELAY_MS || 15_000);
const MEDIA_ROOT = path.resolve("./media");
const HTTP_PORT = Number(process.env.MEDIA_HTTP_PORT || 8000);
const RTMP_PORT = Number(process.env.MEDIA_RTMP_PORT || 1935);
const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

const getHlsFolderPath = (streamKey) =>
  path.join(MEDIA_ROOT, "live", streamKey);

const cancelScheduledCleanup = (streamKey) => {
  const timer = hlsCleanupTimers.get(streamKey);

  if (!timer) return;

  clearTimeout(timer);
  hlsCleanupTimers.delete(streamKey);

  console.log(`[media-service] Cancelled pending HLS cleanup for ${streamKey}`);
};

const removeHlsFolder = async (streamKey) => {
  const folderPath = getHlsFolderPath(streamKey);

  await rm(folderPath, {
    recursive: true,
    force: true,
  });

  console.log(`[media-service] Removed HLS folder: ${folderPath}`);
};

const scheduleHlsCleanup = (streamKey) => {
  cancelScheduledCleanup(streamKey);

  const timer = setTimeout(() => {
    hlsCleanupTimers.delete(streamKey);

    void removeHlsFolder(streamKey).catch((error) => {
      console.error(
        `[media-service] Failed to clean HLS folder for ${streamKey}:`,
        error.message,
      );
    });
  }, HLS_CLEANUP_DELAY_MS);

  timer.unref?.();

  hlsCleanupTimers.set(streamKey, timer);

  console.log(
    `[media-service] HLS cleanup scheduled for ${streamKey} in ${HLS_CLEANUP_DELAY_MS}ms`,
  );
};

const notifyBackend = async (event, streamKey) => {
  const response = await fetch(
    `${BACKEND_INTERNAL_URL}/streams/internal/${event}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-media-service-secret": process.env.MEDIA_SERVICE_SECRET,
      },
      body: JSON.stringify({ streamKey }),
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
};

const configureMediaServer = () => {
  const nms = new NodeMediaServer(config);
  nms.run();

  const rejectSession = (sessionId) => {
    if (
      sessionId &&
      typeof sessionId === "object" &&
      typeof sessionId.reject === "function"
    ) {
      sessionId.reject();
      return;
    }
    nms.getSession?.(sessionId)?.reject?.();
  };

  startHlsUploader(path.join(MEDIA_ROOT, "live"));

  nms.on("prePublish", async (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;
    const streamKey = extractStreamKey(streamPath);
    console.log("Stream started:", streamPath);

    if (!streamPath || !streamKey) {
      console.warn("Rejected malformed stream path:", streamPath);
      rejectSession(id);
      return;
    }
    const user = await User.findOne({ streamKey });
    if (!user) {
      console.log("Invalid stream key:", streamKey);
      rejectSession(id);
      return;
    }
    console.log(`Valid stream key for user: ${user.username || user._id}`);
    cancelScheduledCleanup(streamKey);

    try {
      await notifyBackend("publish", streamKey);
    } catch (error) {
      console.error(
        `[media-service] Could not register live stream: ${error.message}`,
      );
      rejectSession(id);
      return;
    }

    const folderPath = path.join(MEDIA_ROOT, "live", streamKey);
    try {
      await removeHlsFolder(streamKey);
    } catch (error) {
      console.error(
        `[media-service] Failed to reset old HLS files for ${streamKey}:`,
        error.message,
      );

      await notifyBackend("unpublish", streamKey).catch(() => {});
      rejectSession(id);
      return;
    }
    mkdirSync(folderPath, { recursive: true });
    mkdirSync(`${folderPath}/1080p`, { recursive: true });
    mkdirSync(`${folderPath}/720p`, { recursive: true });
    mkdirSync(`${folderPath}/480p`, { recursive: true });

    const masterPlaylist = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480
480p/index.m3u8`;

    writeFileSync(`${folderPath}/index.m3u8`, masterPlaylist);
    console.log("Master playlist created at:", `${folderPath}/index.m3u8`);

    const existingProcess = ffmpegProcesses.get(streamPath);
    if (existingProcess) existingProcess.kill("SIGTERM");

    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-i",
      `rtmp://localhost:${RTMP_PORT}${streamPath}`,

      // ── 1080p ──
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
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
      "delete_segments",
      `${folderPath}/1080p/index.m3u8`,

      // ── 720p ──
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
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
      "delete_segments",
      `${folderPath}/720p/index.m3u8`,

      // ── 480p ──
      "-map",
      "0:v",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
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
      "delete_segments",
      `${folderPath}/480p/index.m3u8`,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.warn(`[ffmpeg ${streamKey}]`, data.toString().trim());
    });

    ffmpeg.on("error", (error) => {
      console.error(`[ffmpeg ${streamKey}] failed to start:`, error.message);
      ffmpegProcesses.delete(streamPath);
      void notifyBackend("unpublish", streamKey).catch((notifyError) =>
        console.error(
          "[media-service] Failed to roll back stream state:",
          notifyError.message,
        ),
      );
    });

    ffmpeg.on("close", (code, signal) => {
      console.log("ffmpeg closed:", { code, signal });
      ffmpegProcesses.delete(streamPath);
      if (typeof code === "number" && code !== 0) {
        void notifyBackend("unpublish", streamKey).catch((notifyError) =>
          console.error(
            "[media-service] Failed to mark failed transcode offline:",
            notifyError.message,
          ),
        );
      }
    });

    ffmpegProcesses.set(streamPath, ffmpeg);
    console.log("ffmpeg started for:", streamPath);
  });

  nms.on("donePublish", async (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;

    console.log("Stream ended:", streamPath);

    const streamKey = extractStreamKey(streamPath);

    if (!streamKey) {
      console.warn(
        "[media-service] Could not extract stream key during donePublish:",
        streamPath,
      );
      return;
    }

    const ffmpeg = ffmpegProcesses.get(streamPath);

    if (ffmpeg) {
      ffmpeg.kill("SIGTERM");
      ffmpegProcesses.delete(streamPath);

      console.log("ffmpeg stopped for:", streamPath);
    }

    try {
      await notifyBackend("unpublish", streamKey);

      console.log(`[media-service] Backend marked ${streamKey} offline`);
    } catch (error) {
      console.error(
        "[media-service] Failed to mark stream offline:",
        error.message,
      );
    } finally {
      scheduleHlsCleanup(streamKey);
    }
  });

  nms.on("prePlay", (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Viewer joined", streamPath);
  });

  console.log(
    `[media-service] RTMP ingest on :${RTMP_PORT}, HLS HTTP on :${HTTP_PORT}`,
  );

  return {
    stop: () => {
      for (const process of ffmpegProcesses.values()) {
        process.kill("SIGTERM");
      }

      ffmpegProcesses.clear();

      for (const timer of hlsCleanupTimers.values()) {
        clearTimeout(timer);
      }

      hlsCleanupTimers.clear();

      nms.stop?.();
    },
  };
};

export default configureMediaServer;
