import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import User from "../models/User.model.js";
import Video from "../models/Video.model.js";
import Stream from "../models/Stream.model.js";
import Donation from "../models/Donation.model.js";
import Comment from "../models/Comment.model.js";
import destroyCloudinaryAsset from "../utils/cloudinaryAssets.js";

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

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    message: user.isActive ? "User unbanned" : "User banned",
    isActive: user.isActive,
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

  await Promise.all([
    Comment.deleteMany({ videoId: video._id }),
    video.deleteOne(),
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
// @desc    Get all streams
// @route   GET /api/admin/streams
// @access  Admin
// ─────────────────────────────────────────────
const getAllStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find()
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(streams);
});

export {
  getStats,
  getAllUsers,
  updateUserRole,
  toggleBanUser,
  getAllVideos,
  deleteVideo,
  getAllStreams,
};
