import mongoose from "mongoose";
import {
  getTimeoutRemainingSeconds,
  isUserBanned,
} from "./moderation.store.js";

const CHAT_WINDOW_MS = 5_000;
const CHAT_LIMIT = 6;
const REACTION_WINDOW_MS = 3_000;
const REACTION_LIMIT = 12;
const ALLOWED_REACTIONS = new Set(["❤️", "🔥", "😂", "👏", "😍", "😮", "💰"]);

const normalizeStreamId = (value) => {
  const streamId = String(value || "").trim();
  return mongoose.isValidObjectId(streamId) ? streamId : "";
};

const isJoinedToStream = (socket, streamId) =>
  socket.rooms.has(`stream:${streamId}`);

const registerChatHandlers = (io, socket) => {
  const recentMessages = [];
  const recentReactions = [];

  socket.on("chat-message", async (payload = {}) => {
    const streamId = normalizeStreamId(payload.streamId);
    const message = String(payload.message || "")
      .trim()
      .slice(0, 500);
    if (!streamId || !message || !isJoinedToStream(socket, streamId)) return;

    // Guests may watch/react, but chat requires an authenticated account.
    // This prevents a banned user from simply clearing the auth cookie and
    // reconnecting anonymously to bypass account moderation.
    if (!socket.data.isAuthenticated || !socket.data.userId) {
      socket.emit("chat-blocked", {
        reason: "authentication-required",
        message: "Đăng nhập để tham gia trò chuyện.",
      });
      return;
    }

    const now = Date.now();
    while (recentMessages.length && recentMessages[0] <= now - CHAT_WINDOW_MS) {
      recentMessages.shift();
    }
    if (recentMessages.length >= CHAT_LIMIT) {
      socket.emit("chat-blocked", {
        reason: "rate-limit",
        retryAfterSeconds: Math.ceil(CHAT_WINDOW_MS / 1000),
        message: "Bạn đang gửi tin nhắn quá nhanh.",
      });
      return;
    }
    recentMessages.push(now);

    const userId = socket.data.userId || null;
    if (userId && (await isUserBanned(String(userId), streamId))) {
      socket.emit("chat-blocked", {
        reason: "ban",
        message: "Bạn đã bị ban khỏi stream này.",
      });
      return;
    }
    if (userId) {
      const retryAfterSeconds = await getTimeoutRemainingSeconds(
        String(userId),
        streamId,
      );
      if (retryAfterSeconds > 0) {
        socket.emit("chat-blocked", {
          reason: "timeout",
          retryAfterSeconds,
          message: `Bạn đang bị timeout. Hãy thử lại sau ${retryAfterSeconds} giây.`,
        });
        return;
      }
    }

    io.to(`stream:${streamId}`).emit("chat-message", {
      id: `${socket.id}:${now}`,
      user: socket.data.username || `Guest-${socket.id.slice(0, 4)}`,
      userId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("send-reaction", (payload = {}) => {
    const streamId = normalizeStreamId(payload.streamId);
    const reaction = String(payload.reaction || "").trim();
    if (
      !streamId ||
      !ALLOWED_REACTIONS.has(reaction) ||
      !isJoinedToStream(socket, streamId)
    ) {
      return;
    }

    const now = Date.now();
    while (
      recentReactions.length &&
      recentReactions[0] <= now - REACTION_WINDOW_MS
    ) {
      recentReactions.shift();
    }
    if (recentReactions.length >= REACTION_LIMIT) return;
    recentReactions.push(now);

    io.to(`stream:${streamId}`).emit("reaction-received", {
      reaction,
      userId: socket.data.userId || socket.id,
    });
  });
};

export default registerChatHandlers;
