import NodeMediaServer from "node-media-server";
import { mkdirSync } from "fs";
import { spawn } from "child_process";
import { writeFileSync} from "fs";

// const FFMPEG_PATH =
//   "C:/Users/LENOVO/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";

const ffmpegProcesses = new Map();

const config = {
  logType: 3,
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    allow_origin: "*",
  },
};

const configureMediaServer = () => {
  const nms = new NodeMediaServer(config);
  nms.run();

  //   Log when have stream connection
  nms.on("prePublish", (id, StreamPath, args) => {
    const path = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Stream started:", path);

    if (!path) return;
    const folderPath = `./media${path}`;

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
      `rtmp://localhost:1935${path}`,

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
      ffmpegProcesses.delete(path);
    });

    ffmpegProcesses.set(path, ffmpeg);
    console.log("ffmpeg started for:", path);
  });

  //   Log when streamer disconnection
  nms.on("donePublish", (id, StreamPath, args) => {
    const path = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Stream ended", path);

    if (path && ffmpegProcesses.has(path)) {
      ffmpegProcesses.get(path).kill();
      ffmpegProcesses.delete(path);
      console.log("ffmpeg stopped for:", path);
    }
  });

  //   Log when viewer connection
  nms.on("prePlay", (id, StreamPath, args) => {
    const path = typeof id === "object" ? id.streamPath : StreamPath;
    console.log("Viewer joined", path);
  });

  console.log("Media server running on RTMP port 1935, HTTP port 5000");
};

export default configureMediaServer;
