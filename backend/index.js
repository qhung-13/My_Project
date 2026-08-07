/**
 * @fileoverview Main entry point for the OmexLive backend API.
 * Initializes the Express server, connects to MongoDB, configures global middlewares,
 * and mounts the API routes.
 */

// Core & Third-party Packages
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";
import { createServer } from "http";
import helmet from "helmet";
import { globalLimiter } from "./src/middlewares/RateLimiting.middleware.js";

// Configurations & Utilities
import connectDB from "./src/config/db.config.js";
import configurePassport from "./src/config/passport.config.js";
import configureCloudinary from "./src/config/cloudinary.config.js";
import {
  assertRequiredEnv,
  getAllowedOrigins,
} from "./src/config/env.config.js";
import createSocketServer from "./src/sockets/index.js";

// Routes
import userRoute from "./src/routes/UserRoute.route.js";
import videoRoute from "./src/routes/VideoRoute.route.js";
import commentRoute from "./src/routes/CommentRoute.route.js";
import streamRoute from "./src/routes/StreamRoute.route.js";
import donateRoute from "./src/routes/DonateRoute.route.js";
import coinRoute from "./src/routes/CoinRoute.route.js";
import adminRoute from "./src/routes/AdminRoute.route.js";
import notification from "./src/routes/Notification.route.js";
import moderationRoute from "./src/routes/ModerationRoute.route.js";
import clipRoute from "./src/routes/ClipRoute.route.js";

// ==========================================
// Initialization & Database Connection
// ==========================================
dotenv.config();
assertRequiredEnv();
configurePassport();
configureCloudinary();
// media ingest/transcoding lives in the separate media-service (see
// ../media-service) — this process no longer runs NodeMediaServer/ffmpeg.
// connectDB will be awaited during startup to allow graceful handling

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);
const port = process.env.PORT || 5000;
const allowedOrigins = getAllowedOrigins();

// ==========================================
// Security Middlewares
// ==========================================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

// ==========================================
// Global Middlewares
// ==========================================
app.use((req, res, next) => {
  if (req.originalUrl === "/api/coins/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(passport.initialize());

// ==========================================
// Socket.IO (see ./src/sockets for handlers)
// ==========================================
const io = createSocketServer(httpServer, allowedOrigins);

// ==========================================
// API Routes
// ==========================================
// Versioned under /api/v1 so a future breaking change can be introduced as
// /api/v2 without forcing every existing client to update at the same
// time. The unversioned /api/* aliases are kept temporarily for backward
// compatibility with any client still pointing at the old paths and
// should be removed in a future release once nothing depends on them.
const v1 = express.Router();
v1.use("/users", userRoute);
v1.use("/videos", videoRoute);
v1.use("/comments", globalLimiter, commentRoute);
v1.use("/streams", globalLimiter, streamRoute);
v1.use("/donations", globalLimiter, donateRoute);
v1.use("/coins", globalLimiter, coinRoute);
v1.use("/admin", globalLimiter, adminRoute);
v1.use("/notifications", notification);
v1.use("/moderation", moderationRoute);
v1.use("/clips", clipRoute);

app.use("/api/v1", v1);
app.use("/api", v1); // TODO(deprecate): remove once all clients use /api/v1

// NOTE: HLS playback (`/live/...`) used to be served directly from this
// process's local disk. That has moved to the standalone media-service
// (see ../media-service), and playback URLs are now returned by the API
// itself (StreamController -> buildHlsUrl()) so the frontend never needs
// to know this backend's host for video playback.

// ==========================================
// Server Startup
// ==========================================

// 404 handler for unknown routes (must come after all real routes)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Centralized error handler for the API
// BUG FIX: this used to derive the status code from `res.statusCode`, which
// Express defaults to 200. Controllers that call `res.status(400)` *before*
// `throw new Error(...)` worked by accident, but any error thrown without
// first setting a status code (e.g. a raw `throw` inside asyncHandler, or an
// unexpected exception) was reported to the client as HTTP 200 with an error
// message in the body — very easy to misread as success.
app.use((err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

// Start function to connect to DB and start the HTTP server
const start = async () => {
  try {
    await connectDB();

    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}...`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

// Graceful shutdown helpers
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  // Decide exit code: non-zero for error-like signals
  const errorSignals = new Set(["uncaughtException", "unhandledRejection"]);
  const exitCode = errorSignals.has(signal) ? 1 : 0;

  try {
    httpServer.close(() => {
      console.log("HTTP server closed.");
      process.exit(exitCode);
    });

    // Attempt to close mongoose connection if present
    try {
      const mongoose = (await import("mongoose")).default;
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    } catch (e) {
      // ignore if mongoose not available
    }

    // If server.close does not call the callback in a timely manner, force exit
    setTimeout(() => {
      console.warn("Forcing process exit.");
      process.exit(exitCode);
    }, 5000);
  } catch (e) {
    console.error("Error during shutdown:", e);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

export { io };
