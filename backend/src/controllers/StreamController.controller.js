import Stream from "../models/Stream.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { createNotification } from "./NotificationController.controller.js";
import User from "../models/User.model.js";
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const [streams, total] = await Promise.all([
    Stream.find({ isLive: true })
      .populate("userId", "username displayName avatar")
      .sort({ viewers: -1 })
      .skip(skip)
      .limit(limit),
    Stream.countDocuments({ isLive: true }),
  ]);

  res.status(200).json({
    streams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
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

// ─────────────────────────────────────────────
// @desc    Schedule a stream
// @route   POST /api/streams/schedule
// @access  Private
// ─────────────────────────────────────────────
const scheduleStream = asyncHandler(async (req, res) => {
  const { title, description, category, tags, scheduledAt } = req.body;
  const userId = req.user._id;

  if (!title || !scheduledAt) {
    res.status(400);
    throw new Error("Title and scheduled time are required");
  }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate < new Date()) {
    res.status(400);
    throw new Error("Scheduled time must be in the future");
  }

  const stream = new Stream({
    userId,
    title,
    description: description || "",
    category: category || "Other",
    tags: tags || [],
    isLive: false,
    isScheduled: true,
    scheduledAt: scheduledDate,
  });

  await stream.save();

  // Notify tất cả followers
  const user = await User.findById(userId).populate("followers");
  const notificationPromises = (user.followers || []).map((followerId) =>
    createNotification({
      userId: followerId,
      fromUserId: userId,
      type: "stream_live",
      message: `${user.username} sẽ livestream "${title}" vào ${scheduledDate.toLocaleString("vi-VN")}`,
      link: `/profile/${userId}`,
    }),
  );
  await Promise.all(notificationPromises);

  res.status(201).json(stream);
});

// ─────────────────────────────────────────────
// @desc    Get scheduled streams
// @route   GET /api/streams/scheduled
// @access  Public
// ─────────────────────────────────────────────
const getScheduledStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find({
    isScheduled: true,
    isLive: false,
    scheduledAt: { $gte: new Date() },
  })
    .populate("userId", "username displayName avatar")
    .sort({ scheduledAt: 1 })
    .limit(20);

  res.status(200).json(streams);
});

// ─────────────────────────────────────────────
// @desc    Get scheduled streams by user
// @route   GET /api/streams/scheduled/:userId
// @access  Public
// ─────────────────────────────────────────────
const getScheduledStreamsByUser = asyncHandler(async (req, res) => {
  const streams = await Stream.find({
    userId: req.params.userId,
    isScheduled: true,
    isLive: false,
    scheduledAt: { $gte: new Date() },
  }).sort({ scheduledAt: 1 });

  res.status(200).json(streams);
});

export {
  startStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamsByUser,
  updateViewers,
  getTopStreamersByHours,
  scheduleStream,
  getScheduledStreams,
  getScheduledStreamsByUser
};
