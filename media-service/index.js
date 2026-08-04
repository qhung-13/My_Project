/**
 * @fileoverview media-service entrypoint.
 *
 * This is a standalone service, deployed and scaled independently from the
 * main API (backend/). It owns:
 *  - the RTMP ingest port (streamers push here via OBS/ffmpeg)
 *  - ffmpeg transcoding to multiple HLS renditions
 *  - (optionally) syncing HLS output to object storage/CDN
 *
 * Why split it out: transcoding 3 renditions per active stream is CPU
 * intensive. Running it in the same process as the REST API meant a busy
 * stream could add latency/jank to unrelated API requests (login, chat
 * REST fallbacks, admin actions, ...) served by that same process. Now the
 * API can be scaled independently (more instances, no GPU/CPU needed) from
 * the media pipeline (fewer, beefier instances with ffmpeg + hardware
 * encoding if available).
 */
import dotenv from "dotenv";
import express from "express";
import path from "path";
import connectDB from "./src/config/db.config.js";
import configureMediaServer from "./src/config/mediaServer.config.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("[media-service] Missing required env var: MONGO_URI");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Local fallback: serve HLS directly from disk. This is what gets used
// whenever CDN_BASE_URL / S3_BUCKET aren't configured (local dev, small
// single-instance deployments) — see backend/src/utils/hlsUrl.js and
// src/services/hlsUploader.service.js for the CDN path.
app.use(
  "/live",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    next();
  },
  express.static(path.join(process.cwd(), "media/live"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".m3u8") {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Cache-Control", "no-cache");
      } else if (ext === ".ts") {
        res.setHeader("Content-Type", "video/MP2T");
      }
    },
  }),
);

const start = async () => {
  try {
    await connectDB();
    configureMediaServer();

    app.listen(port, () => {
      console.log(`[media-service] HTTP (health + local HLS) on :${port}`);
    });
  } catch (error) {
    console.error("[media-service] Failed to start:", error);
    process.exit(1);
  }
};

start();

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
process.on("unhandledRejection", (reason) => {
  // Unlike the API service, an unhandled rejection here shouldn't take
  // down active ffmpeg transcodes for other streamers — log and continue.
  console.error("[media-service] Unhandled Rejection:", reason);
});
