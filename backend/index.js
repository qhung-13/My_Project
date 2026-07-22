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
import { Server } from "socket.io";
import helmet from "helmet";
import { globalLimiter } from "./src/middlewares/RateLimiting.middleware.js";
import {
  isUserBanned,
  isUserTimedOut,
} from "./src/controllers/ModerationController.controller.js";

// Configurations & Utilities
import connectDB from "./src/config/db.config.js";
import configurePassport from "./src/config/passport.config.js";
import configureCloudinary from "./src/config/cloudinary.config.js";
import configureMediaServer from "./src/config/mediaServer.config.js";

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
configurePassport();
configureCloudinary();
configureMediaServer();
// connectDB will be awaited during startup to allow graceful handling

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

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
    origin: [
      "https://my-project-omega-roan.vercel.app",
      "http://localhost:5173",
      "http://localhost",
    ],
    credentials: true,
  }),
);

app.use(passport.initialize());

// ==========================================
// Socket.IO
// ==========================================
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://my-project-omega-roan.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  },
});

const socketUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -- Join stream room --
  // When user join stream, client sent event "join-stream"
  socket.on("join-stream", (streamId, userData) => {
    socket.join(`stream:${streamId}`);
    console.log(`User ${socket.id} joined stream: ${streamId}`);

    if (userData) {
      socketUsers.set(socket.id, { ...userData, streamId });
    }

    const viewers = Array.from(socketUsers.values()).filter(
      (u) => u.streamId === streamId,
    );

    // Announce the current number of viewers in the room
    const viewerCount =
      io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
    io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);

    io.to(`stream:${streamId}`).emit("viewer-list", viewers);
  });

  // Leave stream room
  socket.on("leave-stream", (streamId) => {
    socket.leave(`stream:${streamId}`);
    console.log(`User ${socket.id} left stream: ${streamId}`);

    socketUsers.delete(socket.id);

    // Update the number of viewers after
    const viewerCount =
      io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
    io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);

    const viewers = Array.from(socketUsers.values()).filter(
      (u) => u.streamId === streamId,
    );
    io.to(`stream:${streamId}`).emit("viewer-list", viewers);
  });

  // Send chat
  // When user sent message, client sent event "chat-message"
  socket.on("chat-message", async ({ streamId, message, user, userId }) => {
    if (userId && isUserBanned(userId, streamId)) {
      socket.emit("chat-blocked", {
        message: "Bạn đã bị ban khỏi stream này.",
      });
      return;
    }

    if (userId && isUserTimedOut(userId, streamId)) {
      socket.emit("chat-blocked", {
        message: "Bạn đang bị timeout, vui lòng đợi.",
      });
      return;
    }

    // Broadcast message sent all in room
    io.to(`stream:${streamId}`).emit("chat-message", {
      id: Date.now(),
      user,
      message,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    const userData = socketUsers.get(socket.id);
    if (userData) {
      const { streamId } = userData;
      socketUsers.delete(socket.id);

      const viewerCount =
        io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
      io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);

      const viewers = Array.from(socketUsers.values()).filter(
        (u) => u.streamId === streamId,
      );
      io.to(`stream:${streamId}`).emit("viewer-list", viewers);
    }
    console.log("User disconnected:", socket.id);
  });

  socket.on("send-reaction", ({ streamId, reaction }) => {
    io.to(`stream:${streamId}`).emit("reaction-received", {
      reaction,
      userId: socket.id,
    });
  });
});

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

const serveHLS = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  next();
};

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

// Centralized error handler for the API
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
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
