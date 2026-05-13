import NodeMediaServer from "node-media-server";
import { mkdirSync } from "fs";
import { spawn } from "child_process";

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
  trans: {
    ffmpeg: "ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        hlsKeep: true,
        dash: false,
      },
    ],
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

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      `rtmp://localhost/live/${path.split("/").pop()}`,
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "3",
      "-hls_flags",
      "delete_segments",
      `${folderPath}/index.m3u8`,
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

  console.log("Media server running on RTMP port 1935, HTTP port 8000");
};

export default configureMediaServer;
