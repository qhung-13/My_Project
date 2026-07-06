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

// ==========================================
// Initialization & Database Connection
// ==========================================
dotenv.config();
configurePassport();
configureCloudinary();
configureMediaServer();
connectDB();

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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -- Join stream room --
  // When user join stream, client sent event "join-stream"
  socket.on("join-stream", (streamId) => {
    socket.join(`stream:${streamId}`);
    console.log(`User ${socket.id} joined stream: ${streamId}`);

    // Announce the current number of viewers in the room
    const viewerCount =
      io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
    io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);
  });

  // Leave stream room
  socket.on("leave-stream", (streamId) => {
    socket.leave(`stream:${streamId}`);
    console.log(`User ${socket.id} left stream: ${streamId}`);

    // Update the number of viewers after
    const viewerCount =
      io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
    io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);
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
    console.log("User disconnected:", socket.id);
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
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});

export { io };
