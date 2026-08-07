import NodeMediaServer from "node-media-server";
import { mkdirSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import User from "../model/User.model.js";
import { startHlsUploader } from "../services/hlsUploader.service.js";

const ffmpegProcesses = new Map();
const MEDIA_ROOT = path.resolve("./media");
const HTTP_PORT = Number(process.env.MEDIA_HTTP_PORT || 8000);
const RTMP_PORT = Number(process.env.MEDIA_RTMP_PORT || 1935);

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

  // Sync HLS output to object storage/CDN as segments are written (no-op
  // if S3_BUCKET isn't configured — see hlsUploader.service.js).
  startHlsUploader(path.join(MEDIA_ROOT, "live"));

  nms.on("prePublish", async (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;
    const streamKey = streamPath?.split("/").pop();
    console.log("Stream started:", streamPath);

    if (!streamPath) return;
    const user = await User.findOne({ streamKey });
    if (!user) {
      console.log("Invalid stream key:", streamKey);
      const session = nms.getSession(id);
      if (session) session.reject();
      return;
    }
    console.log(`Valid stream key for user: ${user.username || user._id}`);

    const folderPath = path.join(MEDIA_ROOT, streamPath);
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

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      `rtmp://localhost:${RTMP_PORT}${streamPath}`,

      // ── 1080p ──
      "-map",
      "0:v",
      "-map",
      "0:a",
      "-c:v",
      "libx264",
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
      "0:a",
      "-c:v",
      "libx264",
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
      "0:a",
      "-c:v",
      "libx264",
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
      console.log("ffmpeg:", data.toString());
    });

    ffmpeg.on("close", (code) => {
      console.log("ffmpeg closed:", code);
      ffmpegProcesses.delete(streamPath);
    });

    ffmpegProcesses.set(streamPath, ffmpeg);
    console.log("ffmpeg started for:", streamPath);

    await User.findByIdAndUpdate(user._id, { isLive: true });
  });

  nms.on("donePublish", async (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Stream ended", streamPath);

    if (streamPath && ffmpegProcesses.has(streamPath)) {
      ffmpegProcesses.get(streamPath).kill();
      ffmpegProcesses.delete(streamPath);
      console.log("ffmpeg stopped for:", streamPath);
    }

    try {
      const streamKey = streamPath?.split("/").pop();
      if (!streamKey) return;

      const user = await User.findOne({ streamKey });
      if (user) {
        await User.findByIdAndUpdate(user._id, { isLive: false });
      }
    } catch (error) {
      console.error("Error while finalizing donePublish:", error);
    }
  });

  nms.on("prePlay", (id, StreamPath, args) => {
    const streamPath = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Viewer joined", streamPath);
  });

  console.log(
    `[media-service] RTMP ingest on :${RTMP_PORT}, HLS HTTP on :${HTTP_PORT}`,
  );
};

export default configureMediaServer;
