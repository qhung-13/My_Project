import mongoose from "mongoose";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import Stream from "../models/Stream.model.js";
import {
  banUserInStore,
  unbanUserInStore,
  timeoutUserInStore,
} from "../sockets/moderation.store.js";

const validateIds = (userId, streamId, res) => {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(streamId)
  ) {
    res.status(400);
    throw new Error("Invalid user or stream id");
  }
};

const assertCanModerate = async (req, streamId, targetUserId, res) => {
  const stream = await Stream.findById(streamId).select("userId isLive");
  if (!stream) {
    res.status(404);
    throw new Error("Stream not found");
  }
  if (!stream.isLive) {
    res.status(409);
    throw new Error("Cannot moderate an offline stream");
  }
  if (stream.userId.toString() === String(targetUserId)) {
    res.status(400);
    throw new Error("The streamer cannot be moderated in their own stream");
  }
  if (req.isAgent) return;

  const requesterId = req.user._id.toString();
  if (stream.userId.toString() !== requesterId && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Only the streamer or an admin can moderate this stream");
  }
  if (requesterId === String(targetUserId)) {
    res.status(400);
    throw new Error("You cannot moderate yourself");
  }
};

const timeoutUser = asyncHandler(async (req, res) => {
  const { userId, streamId } = req.body;
  const durationSeconds = Number(req.body.durationSeconds);
  validateIds(userId, streamId, res);
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 10 ||
    durationSeconds > 86_400
  ) {
    res.status(400);
    throw new Error("Timeout duration must be between 10 and 86400 seconds");
  }

  await assertCanModerate(req, streamId, userId, res);
  await timeoutUserInStore(String(userId), String(streamId), durationSeconds);
  req.app
    .get("io")
    ?.to(`stream:${streamId}`)
    .emit("user-moderated", {
      userId: String(userId),
      action: "timeout",
      durationSeconds,
      message: `Bạn đã bị timeout ${durationSeconds} giây.`,
    });
  res.status(200).json({ success: true });
});

const banUser = asyncHandler(async (req, res) => {
  const { userId, streamId } = req.body;
  const reason = String(req.body.reason || "Vi phạm quy tắc cộng đồng")
    .trim()
    .slice(0, 200);
  validateIds(userId, streamId, res);
  await assertCanModerate(req, streamId, userId, res);

  await banUserInStore(String(userId), String(streamId));
  req.app
    .get("io")
    ?.to(`stream:${streamId}`)
    .emit("user-moderated", {
      userId: String(userId),
      action: "ban",
      reason,
      message: `Bạn đã bị ban khỏi stream này. Lý do: ${reason}`,
    });
  res.status(200).json({ success: true });
});

const unbanUser = asyncHandler(async (req, res) => {
  const { userId, streamId } = req.body;
  validateIds(userId, streamId, res);
  await assertCanModerate(req, streamId, userId, res);

  await unbanUserInStore(String(userId), String(streamId));
  req.app
    .get("io")
    ?.to(`stream:${streamId}`)
    .emit("user-unmoderated", {
      userId: String(userId),
    });
  res.status(200).json({ success: true });
});

export { timeoutUser, banUser, unbanUser };
