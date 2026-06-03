import Stream from "../models/Stream.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────
// @desc    Start a stream
// @route   POST /api/streams/start
// @access  Private
// ─────────────────────────────────────────────
const startStream = asyncHandler(async (req, res) => {
  const { title, description, category, tags } = req.body;
  const userId = req.user._id;

  if (!title || !description || !category) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  // Check nếu user đang live rồi
  const existingStream = await Stream.findOne({ userId, isLive: true });
  if (existingStream) {
    res.status(400);
    throw new Error("You are already streaming");
  }

  // Sinh streamKey unique
  const streamKey = uuidv4();

  // Tạo stream mới
  const stream = new Stream({
    userId,
    title,
    description,
    category,
    tags: tags || [],
    streamKey,
    isLive: true,
    startedAt: new Date(),
  });

  await stream.save();

  // Update role thành streamer
  await User.findByIdAndUpdate(userId, { role: "streamer" });

  res.status(201).json({
    _id: stream._id,
    userId: stream.userId,
    title: stream.title,
    description: stream.description,
    category: stream.category,
    tags: stream.tags,
    streamKey: stream.streamKey,
    isLive: stream.isLive,
    startedAt: stream.startedAt,
  });
});

// ─────────────────────────────────────────────
// @desc    End a stream
// @route   POST /api/streams/end
// @access  Private
// ─────────────────────────────────────────────
const endStream = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Tìm stream đang live của user
  const stream = await Stream.findOne({ userId, isLive: true });
  if (!stream) {
    res.status(404);
    throw new Error("No active stream found");
  }

  // Kết thúc stream
  stream.isLive = false;
  stream.endedAt = new Date();
  await stream.save();

  res.status(200).json({ message: "Stream ended successfully" });
});

// ─────────────────────────────────────────────
// @desc    Get all live streams
// @route   GET /api/streams
// @access  Public
// ─────────────────────────────────────────────
const getLiveStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ isLive: true })
    .populate("userId", "username displayName avatar")
    .sort({ viewers: -1 }); // Sắp xếp theo viewers cao nhất

  res.status(200).json(streams);
});

// ─────────────────────────────────────────────
// @desc    Get a single stream by ID
// @route   GET /api/streams/:id
// @access  Public
// ─────────────────────────────────────────────
const getStreamById = asyncHandler(async (req, res) => {
  const stream = await Stream.findById(req.params.id).populate(
    "userId",
    "username displayName avatar",
  );

  if (!stream) {
    res.status(404);
    throw new Error("Stream not found");
  }

  res.status(200).json(stream);
});

// ─────────────────────────────────────────────
// @desc    Get streams by user ID
// @route   GET /api/streams/user/:userId
// @access  Public
// ─────────────────────────────────────────────
const getStreamsByUser = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ userId: req.params.userId }).sort({
    createdAt: -1,
  });

  res.status(200).json(streams);
});

// ─────────────────────────────────────────────
// @desc    Update viewer count
// @route   PUT /api/streams/:id/viewers
// @access  Private
// ─────────────────────────────────────────────
const updateViewers = asyncHandler(async (req, res) => {
  const { viewers } = req.body;

  const stream = await Stream.findById(req.params.id);
  if (!stream) {
    res.status(404);
    throw new Error("Stream not found");
  }

  stream.viewers = viewers;
  if (viewers > stream.peakViewers) {
    stream.peakViewers = viewers;
  }
  await stream.save();

  res
    .status(200)
    .json({ viewers: stream.viewers, peakViewers: stream.peakViewers });
});

// ─────────────────────────────────────────────
// @desc    Get top streamers by hours
// @route   GET /api/streams/top-hours
// @access  Public
// ─────────────────────────────────────────────
const getTopStreamersByHours = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ endedAt: { $ne: null } }).populate(
    "userId",
    "username displayName avatar",
  );

  // Tính tổng giờ stream theo userId
  const hoursMap = new Map();
  streams.forEach((stream) => {
    if (!stream.startedAt || !stream.endedAt) return;
    const hours =
      (new Date(stream.endedAt) - new Date(stream.startedAt)) /
      (1000 * 60 * 60);
    const uid = stream.userId?._id?.toString();
    if (!uid) return;
    hoursMap.set(uid, {
      user: stream.userId,
      hours: (hoursMap.get(uid)?.hours || 0) + hours,
    });
  });

  const result = Array.from(hoursMap.values())
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map((item) => ({
      ...item.user._doc,
      totalHours: Math.round(item.hours),
    }));

  res.status(200).json(result);
});

export {
  startStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamsByUser,
  updateViewers,
  getTopStreamersByHours,
};
