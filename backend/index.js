/**
 * @fileoverview Main entry point for the OmexLive backend API.
 * Initializes the Express server, connects to MongoDB, configures global middlewares,
 * and mounts the API routes.
 */

// Core & Third-party Packages
import path from "path";
import express from "express";
import dotenv from "dotenv";
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
import configureMediaServer from "./src/config/mediaServer.config.js";
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
configureMediaServer();
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
app.use("/api/users", userRoute);
app.use("/api/videos", videoRoute);
app.use("/api/comments", globalLimiter, commentRoute);
app.use("/api/streams", globalLimiter, streamRoute);
app.use("/api/donations", globalLimiter, donateRoute);
app.use("/api/coins", globalLimiter, coinRoute);
app.use("/api/admin", globalLimiter, adminRoute);
app.use("/api/notification", notification);
app.use("/api/moderation", moderationRoute);
app.use("/api/clips", clipRoute);

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
        res.setHeader("Content-Type", "video/MP2T"); // Giữ nguyên
      }
    },
  }),
);

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
