import {
  getTimeoutRemainingSeconds,
  isUserBanned,
} from "./moderation.store.js";

const CHAT_WINDOW_MS = 5_000;
const CHAT_LIMIT = 6;

const registerChatHandlers = (io, socket) => {
  const recentMessages = [];

  socket.on("chat-message", async (payload = {}) => {
    const streamId = String(payload.streamId || "")
      .trim()
      .slice(0, 100);
    const message = String(payload.message || "")
      .trim()
      .slice(0, 500);
    if (!streamId || !message) return;

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
    const streamId = String(payload.streamId || "")
      .trim()
      .slice(0, 100);
    const reaction = String(payload.reaction || "")
      .trim()
      .slice(0, 16);
    if (!streamId || !reaction) return;
    io.to(`stream:${streamId}`).emit("reaction-received", {
      reaction,
      userId: socket.data.userId || socket.id,
    });
  });
};

export default registerChatHandlers;
