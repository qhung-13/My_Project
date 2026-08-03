import { isUserBanned, isUserTimedOut } from "../controllers/ModerationController.controller.js";

/**
 * Registers "chat-message" and "send-reaction" handlers for a single
 * connected socket.
 */
const registerChatHandlers = (io, socket) => {
  socket.on("chat-message", async ({ streamId, message, user }) => {
    if (!streamId || !message?.trim()) return;

    // SECURITY FIX: previously `userId` came straight from the client
    // payload, so a banned/timed-out viewer could just send a different
    // userId and bypass moderation. We now use the id resolved from the
    // verified JWT cookie (see auth.socket.js) whenever the user is logged
    // in, and only fall back to "anonymous" for guests.
    const userId = socket.data.userId || null;

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

    io.to(`stream:${streamId}`).emit("chat-message", {
      id: Date.now(),
      user,
      userId,
      message: message.trim().slice(0, 500), // basic length guard
      timestamp: new Date(),
    });
  });

  socket.on("send-reaction", ({ streamId, reaction }) => {
    if (!streamId || !reaction) return;
    io.to(`stream:${streamId}`).emit("reaction-received", {
      reaction,
      userId: socket.data.userId || socket.id,
    });
  });
};

export default registerChatHandlers;
