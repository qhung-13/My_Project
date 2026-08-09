import "dotenv/config";
import express from "express";
import { timingSafeEqual } from "node:crypto";
import path from "path";
import mongoose from "mongoose";
import connectDB from "./src/config/db.config.js";
import configureMediaServer from "./src/config/mediaServer.config.js";
import { stopHlsUploader } from "./src/services/hlsUploader.service.js";

const requiredEnv = [
  "MONGO_URI",
  "MEDIA_SERVICE_SECRET",
  "MEDIA_PUBLISH_AUTH_SECRET",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());
if (missingEnv.length > 0) {
  console.error(
    `[media-service] Missing required env vars: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}
if (process.env.MEDIA_SERVICE_SECRET.length < 32) {
  console.error(
    "[media-service] MEDIA_SERVICE_SECRET must contain at least 32 characters",
  );
  process.exit(1);
}
if (process.env.MEDIA_PUBLISH_AUTH_SECRET.length < 32) {
  console.error(
    "[media-service] MEDIA_PUBLISH_AUTH_SECRET must contain at least 32 characters",
  );
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 8080);
app.disable("x-powered-by");
app.get("/health", (req, res) => res.json({ status: "ok" }));

const mediaSecretMatches = (provided) => {
  const expected = process.env.MEDIA_SERVICE_SECRET || "";
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

app.post(
  "/internal/streams/terminate",
  express.json({ limit: "4kb" }),
  async (req, res) => {
    if (!mediaSecretMatches(req.get("x-media-service-secret"))) {
      return res
        .status(401)
        .json({ message: "Unauthorized media control request" });
    }

    const streamKey = String(req.body?.streamKey || "").trim();
    if (!/^[a-zA-Z0-9-]{16,128}$/.test(streamKey)) {
      return res.status(400).json({ message: "Invalid stream key" });
    }

    if (!mediaServer?.terminateByStreamKey) {
      return res.status(503).json({ message: "Media server is not ready" });
    }

    const result = await mediaServer.terminateByStreamKey(streamKey);
    return res.status(200).json(result);
  },
);

app.use(
  "/live",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(process.cwd(), "media/live"), {
    fallthrough: false,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".m3u8") {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      } else if (ext === ".ts") {
        res.setHeader("Content-Type", "video/MP2T");
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      }
    },
  }),
);

let httpServer;
let mediaServer;

const start = async () => {
  try {
    await connectDB();
    mediaServer = await configureMediaServer();
    httpServer = app.listen(port, () => {
      console.log(`[media-service] HTTP (health + local HLS) on :${port}`);
    });
  } catch (error) {
    console.error("[media-service] Failed to start:", error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`[media-service] ${signal}: shutting down`);
  await mediaServer?.stop?.();
  await stopHlsUploader();
  await mongoose.connection.close();
  if (httpServer) {
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  } else {
    process.exit(0);
  }
};

void start();
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[media-service] Unhandled Rejection:", reason);
});
