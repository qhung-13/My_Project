import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import User from "../models/User.model.js";
import Video from "../models/Video.model.js";
import Stream from "../models/Stream.model.js";
import Donation from "../models/Donation.model.js";
import Comment from "../models/Comment.model.js";
import destroyCloudinaryAsset from "../utils/cloudinaryAssets.js";
import terminateMediaStream from "../utils/mediaControl.js";
import { clearViewersForStream } from "../sockets/presence.store.js";
import serializePublicStream from "../utils/streamPayload.js";

// ─────────────────────────────────────────────
// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
// ─────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalVideos, totalStreams, totalDonations] =
    await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Stream.countDocuments(),
      Donation.countDocuments(),
    ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("username email avatar createdAt role");

  res.status(200).json({
    totalUsers,
    totalVideos,
    totalStreams,
    totalDonations,
    recentUsers,
  });
});

// ─────────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
// ─────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password");

  res.status(200).json(users);
});

// ─────────────────────────────────────────────
// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
// ─────────────────────────────────────────────
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (req.params.id === req.user._id.toString() && role !== "admin") {
    res.status(400);
    throw new Error("You cannot remove your own admin role");
  }

  if (!["user", "streamer", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true },
  ).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});

// ─────────────────────────────────────────────
// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Admin
// ─────────────────────────────────────────────
const toggleBanUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot ban your own account");
  }

  const user = await User.findById(req.params.id).select("+streamKey");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const banning = user.isActive;
  user.isActive = !user.isActive;

  const activeStreams = banning
    ? await Stream.find({ userId: user._id, isLive: true }).select("_id")
    : [];

  let mediaTerminationWarning = null;
  if (banning && activeStreams.length > 0 && user.streamKey) {
    try {
      await terminateMediaStream(user.streamKey);
    } catch (error) {
      mediaTerminationWarning = error.message;
      console.error(
        `[admin] Failed to terminate media for banned user ${user._id}:`,
        error.message,
      );
    }
  }

  if (banning) {
    user.isLive = false;
    // Revoke the current OBS credential when an account is banned. This also
    // prevents a leaked key from being reused if the account is later unbanned.
    user.streamKey = uuidv4();
  }
  await user.save();

  if (!user.isActive && activeStreams.length > 0) {
    const endedAt = new Date();
    await Stream.updateMany(
      { _id: { $in: activeStreams.map((stream) => stream._id) } },
      { $set: { isLive: false, viewers: 0, endedAt } },
    );

    const io = req.app.get("io");
    for (const stream of activeStreams) {
      await clearViewersForStream(stream._id.toString());
      io?.to(`stream:${stream._id}`).emit("viewer-count", 0);
      io?.to(`stream:${stream._id}`).emit("viewer-list", []);
      io?.to(`stream:${stream._id}`).emit("stream-ended", {
        streamId: stream._id,
        endedAt,
      });
    }
  }

  if (!user.isActive) {
    // Existing JWTs are rejected by HTTP middleware on the next request;
    // disconnect current sockets immediately so a banned account cannot keep
    // chatting from an already-open realtime connection.
    req.app.get("io")?.in(`user:${user._id}`).disconnectSockets(true);
  }

  res.status(200).json({
    message: user.isActive ? "User unbanned" : "User banned",
    isActive: user.isActive,
    mediaTerminationWarning,
  });
});

// ─────────────────────────────────────────────
// @desc    Get all videos
// @route   GET /api/admin/videos
// @access  Admin
// ─────────────────────────────────────────────
const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find()
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(videos);
});

// ─────────────────────────────────────────────
// @desc    Delete video
// @route   DELETE /api/admin/videos/:id
// @access  Admin
// ─────────────────────────────────────────────
const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const dependentClips =
    video.type === "vod"
      ? await Video.find({ sourceVideoId: video._id }).select("_id")
      : [];
  const videoIds = [video._id, ...dependentClips.map((clip) => clip._id)];

  await Promise.all([
    Comment.deleteMany({ videoId: { $in: videoIds } }),
    Video.deleteMany({ _id: { $in: videoIds } }),
  ]);
  await Promise.all([
    destroyCloudinaryAsset(video.videoPublicId, "video"),
    destroyCloudinaryAsset(video.thumbnailPublicId, "image"),
  ]);
  res
    .status(200)
    .json({ message: "Video and related comments deleted successfully" });
});

// ─────────────────────────────────────────────
// @desc    Force-end a live stream
// @route   PUT /api/v1/admin/streams/:id/end
// @access  Admin
// ─────────────────────────────────────────────
const endStreamByAdmin = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid stream id");
  }

  const stream = await Stream.findById(req.params.id);
  if (!stream) {
    res.status(404);
    throw new Error("Stream not found");
  }
  if (!stream.isLive) {
    return res.status(200).json({
      message: "Stream is already offline",
      idempotent: true,
    });
  }

  const user = await User.findById(stream.userId).select("+streamKey");
  if (user?.streamKey) {
    // The database is not changed until the media control plane confirms the
    // active publisher/FFmpeg has been terminated (or no publisher exists).
    await terminateMediaStream(user.streamKey);
  }

  const endedAt = new Date();
  stream.isLive = false;
  stream.viewers = 0;
  stream.endedAt = endedAt;
  await stream.save();
  await clearViewersForStream(stream._id.toString());
  if (user) {
    user.isLive = false;
    await user.save();
  }

  const io = req.app.get("io");
  io?.to(`stream:${stream._id}`).emit("viewer-count", 0);
  io?.to(`stream:${stream._id}`).emit("viewer-list", []);
  io?.to(`stream:${stream._id}`).emit("stream-ended", {
    streamId: stream._id,
    endedAt,
  });
  io?.emit("stream-stopped", {
    streamId: stream._id,
    userId: stream.userId,
  });

  return res.status(200).json({ message: "Stream ended successfully" });
});

// ─────────────────────────────────────────────
// @desc    Get all streams
// @route   GET /api/admin/streams
// @access  Admin
// ─────────────────────────────────────────────
const getAllStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find()
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(streams.map(serializePublicStream));
});

export {
  getStats,
  getAllUsers,
  updateUserRole,
  toggleBanUser,
  getAllVideos,
  deleteVideo,
  getAllStreams,
  endStreamByAdmin,
};
