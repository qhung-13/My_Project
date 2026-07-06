import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { io } from "../../index.js";

// In-memory store cho timeout và ban list
const timeoutList = new Map(); // "userId:streamId" -> expiry timestamp
const banList = new Map(); // "streamId" -> Set of banned userIds

// ─────────────────────────────────────────────
// @desc    Timeout user trong stream
// @route   POST /api/moderation/timeout
// @access  Private (streamer only)
// ─────────────────────────────────────────────
const timeoutUser = asyncHandler(async (req, res) => {
  const { userId, streamId, durationSeconds } = req.body;

  const key = `${userId}:${streamId}`;
  const expiry = Date.now() + durationSeconds * 1000;
  timeoutList.set(key, expiry);

  // Cleanup sau khi hết timeout
  setTimeout(() => timeoutList.delete(key), durationSeconds * 1000);

  // Notify user bị timeout qua Socket.io
  io.to(`stream:${streamId}`).emit("user-moderated", {
    userId,
    action: "timeout",
    durationSeconds,
    message: `Bạn đã bị timeout ${durationSeconds} giây.`,
  });

  console.log(
    `[Moderation] User ${userId} timed out in stream ${streamId} for ${durationSeconds}s`,
  );
  res.status(200).json({ success: true });
});

// ─────────────────────────────────────────────
// @desc    Ban user khỏi stream
// @route   POST /api/moderation/ban
// @access  Private (streamer only)
// ─────────────────────────────────────────────
const banUser = asyncHandler(async (req, res) => {
  const { userId, streamId, reason } = req.body;

  if (!banList.has(streamId)) {
    banList.set(streamId, new Set());
  }
  banList.get(streamId).add(userId);

  // Notify user bị ban
  io.to(`stream:${streamId}`).emit("user-moderated", {
    userId,
    action: "ban",
    reason,
    message: `Bạn đã bị ban khỏi stream này. Lý do: ${reason}`,
  });

  console.log(`[Moderation] User ${userId} banned from stream ${streamId}`);
  res.status(200).json({ success: true });
});

// ─────────────────────────────────────────────
// @desc    Unban user
// @route   POST /api/moderation/unban
// @access  Private (streamer only)
// ─────────────────────────────────────────────
const unbanUser = asyncHandler(async (req, res) => {
  const { userId, streamId } = req.body;

  if (banList.has(streamId)) {
    banList.get(streamId).delete(userId);
  }

  io.to(`stream:${streamId}`).emit("user-unmoderated", { userId });
  res.status(200).json({ success: true });
});

// Helper check timeout/ban — dùng trong Socket.io chat handler
export const isUserBanned = (userId, streamId) => {
  return banList.get(streamId)?.has(userId) || false;
};

export const isUserTimedOut = (userId, streamId) => {
  const key = `${userId}:${streamId}`;
  const expiry = timeoutList.get(key);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    timeoutList.delete(key);
    return false;
  }
  return true;
};

export { timeoutUser, banUser, unbanUser };
