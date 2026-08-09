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
import { closeRedisClients } from "./src/config/redis.config.js";

// Service
import startStreamLivenessMonitor from "./src/service/streamLiveness.service.js";

// Routes
import userRoute from "./src/routes/UserRoute.route.js";
import videoRoute from "./src/routes/VideoRoute.route.js";
import commentRoute from "./src/routes/CommentRoute.route.js";
import streamRoute from "./src/routes/StreamRoute.route.js";
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
  // Stripe verifies the signature against the *raw* request body. Keep both
  // the versioned endpoint and the temporary legacy alias raw; parsing either
  // one as JSON first makes every valid Stripe signature fail verification.
  const isStripeWebhook = /^\/api(?:\/v1)?\/coins\/webhook(?:\?|$)/.test(
    req.originalUrl,
  );

  if (isStripeWebhook) {
    express.raw({ type: "application/json" })(req, res, next);
    return;
  }

  express.json()(req, res, next);
});
app.use(cookieParser());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Cookie auth may use SameSite=None when frontend/API live on different
// HTTPS sites (for example Vercel + Render). CORS controls what JavaScript
// can read, but does not by itself prevent a cross-site form/request from
// reaching a state-changing endpoint. Browser requests carrying our JWT
// cookie must therefore originate from an allow-listed frontend. Internal
// service calls and bearer-token/API clients do not carry the jwt cookie and
// are unaffected.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
app.use((req, res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.jwt) return next();

  const origin = req.get("origin")?.replace(/\/$/, "");
  const fetchSite = req.get("sec-fetch-site");
  const originAllowed = origin ? allowedOrigins.includes(origin) : false;

  if ((origin && !originAllowed) || (!origin && fetchSite === "cross-site")) {
    return res.status(403).json({ message: "Cross-site request rejected" });
  }

  return next();
});

app.use(passport.initialize());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ==========================================
// Socket.IO (see ./src/sockets for handlers)
// ==========================================
// Initialized after MongoDB/Redis health checks in start(). Routes can be
// mounted before this because the HTTP server does not listen until startup
// completes.
let io = null;
let stopStreamLivenessMonitor = null;

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
v1.use("/comments", commentRoute);
v1.use("/streams", streamRoute);
v1.use("/coins", coinRoute);
v1.use("/admin", adminRoute);
v1.use("/notifications", notification);
v1.use("/moderation", moderationRoute);
v1.use("/clips", clipRoute);

app.use("/api/v1", globalLimiter, v1);
app.use("/api", globalLimiter, v1); // TODO(deprecate): remove once all clients use /api/v1

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
  let statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Internal Server Error";

  if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid request data";
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = "A resource with the same unique value already exists";
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

// Start function to connect to DB and start the HTTP server
const start = async () => {
  try {
    await connectDB();
    io = await createSocketServer(httpServer, allowedOrigins);
    app.set("io", io);
    stopStreamLivenessMonitor = startStreamLivenessMonitor(io);

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
let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down gracefully...`);
  const errorSignals = new Set(["uncaughtException", "unhandledRejection"]);
  const exitCode = errorSignals.has(signal) ? 1 : 0;
  const forceExitTimer = setTimeout(() => {
    console.warn("Forcing process exit after graceful-shutdown timeout.");
    process.exit(exitCode || 1);
  }, 5000);

  try {
    stopStreamLivenessMonitor?.();
    stopStreamLivenessMonitor = null;
    // Socket.IO owns the underlying HTTP server, so closing it drains both
    // realtime sockets and HTTP connections without racing two close calls.
    if (io) {
      await new Promise((resolve) => io.close(() => resolve()));
      console.log("Socket.IO and HTTP server closed.");
    } else {
      await new Promise((resolve) => httpServer.close(() => resolve()));
    }

    await closeRedisClients();

    const mongoose = (await import("mongoose")).default;
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");

    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error("Error during shutdown:", error);
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
