import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Stream from "../models/Stream.model.js";
import User from "../models/User.model.js";
import Donation from "../models/Donation.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { createNotification } from "./NotificationController.controller.js";
import {
  clearViewersForStream,
  getViewersForStream,
} from "../sockets/presence.store.js";
import buildHlsUrl from "../utils/hlsUrl.js";

const clampPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 12),
  );
  return { page, limit, skip: (page - 1) * limit };
};

const cleanTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))]
    .slice(0, 10)
    .map((tag) => tag.slice(0, 30));
};

const serializeStream = (stream) => {
  const object = stream.toObject ? stream.toObject() : stream;
  return {
    ...object,
    hlsUrl: object.isLive ? buildHlsUrl(object.streamKey) : null,
  };
};

const startStream = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const category = String(req.body.category || "").trim();
  const userId = req.user._id;

  if (!title || !category) {
    res.status(400);
    throw new Error("Title and category are required");
  }

  const existingLiveStream = await Stream.findOne({ userId, isLive: true });
  if (existingLiveStream) {
    res.status(409);
    throw new Error("You are already streaming");
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.streamKey) user.streamKey = uuidv4();
  user.role = user.role === "admin" ? "admin" : "streamer";
  await user.save();

  // Preparing a stream must not make the channel appear live. The media
  // service promotes this draft only after OBS has successfully published.
  let stream = await Stream.findOne({
    userId,
    streamKey: user.streamKey,
    isLive: false,
    isScheduled: false,
    startedAt: null,
    endedAt: null,
  }).sort({ createdAt: -1 });

  const values = {
    title: title.slice(0, 120),
    description: description.slice(0, 1000),
    category: category.slice(0, 60),
    tags: cleanTags(req.body.tags),
    streamKey: user.streamKey,
    isLive: false,
    isScheduled: false,
    startedAt: null,
    endedAt: null,
  };

  if (stream) {
    Object.assign(stream, values);
    await stream.save();
  } else {
    stream = await Stream.create({ userId, ...values });
  }

  res.status(201).json({
    message: "Stream setup saved. Start streaming from OBS when ready.",
    stream: serializeStream(stream),
  });
});

const notifyFollowersStreamStarted = async (user, stream) => {
  if (!user.followers?.length) return;
  await Promise.allSettled(
    user.followers.map((followerId) =>
      createNotification({
        userId: followerId,
        fromUserId: user._id,
        type: "stream_live",
        message: `${user.displayName || user.username} is live: ${stream.title}`,
        link: `/stream/${stream._id}`,
      }),
    ),
  );
};

const streamPublished = asyncHandler(async (req, res) => {
  const streamKey = String(req.body.streamKey || "").trim();
  if (!/^[a-zA-Z0-9-]{16,128}$/.test(streamKey)) {
    res.status(400);
    throw new Error("Invalid stream key");
  }

  const user = await User.findOne({ streamKey, isActive: true });
  if (!user) {
    res.status(404);
    throw new Error("Streamer not found");
  }

  const alreadyLive = await Stream.findOne({ userId: user._id, isLive: true });
  if (alreadyLive) {
    return res
      .status(200)
      .json({ stream: serializeStream(alreadyLive), idempotent: true });
  }

  const now = new Date();
  let stream = await Stream.findOne({
    userId: user._id,
    streamKey,
    isLive: false,
    isScheduled: false,
    startedAt: null,
    endedAt: null,
  }).sort({ createdAt: -1 });

  if (!stream) {
    stream = await Stream.create({
      userId: user._id,
      title: `${user.displayName || user.username}'s live stream`,
      description: "",
      category: "Other",
      streamKey,
      isLive: true,
      startedAt: now,
    });
  } else {
    stream.isLive = true;
    stream.startedAt = now;
    stream.endedAt = null;
    stream.viewers = 0;
    await stream.save();
  }

  user.isLive = true;
  user.role = user.role === "admin" ? "admin" : "streamer";
  await user.save();

  await notifyFollowersStreamStarted(user, stream);
  req.app.get("io")?.emit("stream-started", serializeStream(stream));
  return res.status(200).json({ stream: serializeStream(stream) });
});

const finishStream = async ({ stream, userId, io }) => {
  stream.isLive = false;
  stream.viewers = 0;
  stream.endedAt = new Date();
  await stream.save();
  await clearViewersForStream(stream._id.toString());
  await User.findByIdAndUpdate(userId, { isLive: false });
  io?.to(`stream:${stream._id}`).emit("stream-ended", {
    streamId: stream._id,
    endedAt: stream.endedAt,
  });
  io?.emit("stream-stopped", { streamId: stream._id, userId });
  return stream;
};

const streamUnpublished = asyncHandler(async (req, res) => {
  const streamKey = String(req.body.streamKey || "").trim();
  if (!streamKey) {
    res.status(400);
    throw new Error("Stream key is required");
  }

  const user = await User.findOne({ streamKey });
  if (!user) return res.status(200).json({ idempotent: true });

  const stream = await Stream.findOne({ userId: user._id, isLive: true }).sort({
    startedAt: -1,
  });
  if (!stream) {
    await User.findByIdAndUpdate(user._id, { isLive: false });
    return res.status(200).json({ idempotent: true });
  }

  await finishStream({ stream, userId: user._id, io: req.app.get("io") });
  return res.status(200).json({ message: "Stream ended successfully" });
});

const endStream = asyncHandler(async (req, res) => {
  const stream = await Stream.findOne({ userId: req.user._id, isLive: true });
  if (!stream) {
    res.status(404);
    throw new Error("No active stream found");
  }

  await finishStream({ stream, userId: req.user._id, io: req.app.get("io") });
  res.status(200).json({ message: "Stream ended successfully" });
});

const getCurrentStream = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stream = await Stream.findOne({
    userId,
    $or: [
      { isLive: true },
      {
        isLive: false,
        isScheduled: false,
        startedAt: null,
        endedAt: null,
      },
    ],
  })
    .sort({ isLive: -1, createdAt: -1 })
    .populate("userId", "username displayName avatar");

  res.status(200).json({
    stream: stream ? serializeStream(stream) : null,
  });
});

const getLiveStreams = asyncHandler(async (req, res) => {
  const { page, limit, skip } = clampPagination(req.query);
  const [streams, total] = await Promise.all([
    Stream.find({ isLive: true })
      .populate("userId", "username displayName avatar")
      .sort({ viewers: -1, startedAt: -1 })
      .skip(skip)
      .limit(limit),
    Stream.countDocuments({ isLive: true }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    streams: streams.map(serializeStream),
    pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
  });
});

const getStreamById = asyncHandler(async (req, res) => {
  const stream = await Stream.findById(req.params.id).populate(
    "userId",
    "username displayName avatar",
  );
  if (!stream) {
    res.status(404);
    throw new Error("Stream not found");
  }
  res.status(200).json(serializeStream(stream));
});

const getStreamsByUser = asyncHandler(async (req, res) => {
  const { page, limit, skip } = clampPagination(req.query);
  const filter = { userId: req.params.userId };
  const [streams, total] = await Promise.all([
    Stream.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Stream.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    streams: streams.map(serializeStream),
    pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
  });
});

const getTopStreamersByHours = asyncHandler(async (req, res) => {
  const streams = await Stream.find({
    startedAt: { $ne: null },
    endedAt: { $ne: null },
  }).populate("userId", "username displayName avatar");
  const hoursMap = new Map();

  for (const stream of streams) {
    const userId = stream.userId?._id?.toString();
    if (!userId) continue;
    const hours = Math.max(0, (stream.endedAt - stream.startedAt) / 3_600_000);
    const current = hoursMap.get(userId) || { user: stream.userId, hours: 0 };
    current.hours += hours;
    hoursMap.set(userId, current);
  }

  const result = [...hoursMap.values()]
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
    .map(({ user, hours }) => ({
      ...user.toObject(),
      totalHours: Math.round(hours * 10) / 10,
    }));
  res.status(200).json(result);
});

const scheduleStream = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  const scheduledDate = new Date(req.body.scheduledAt);
  if (!title || Number.isNaN(scheduledDate.getTime())) {
    res.status(400);
    throw new Error("A title and valid scheduled time are required");
  }
  if (scheduledDate.getTime() <= Date.now() + 60_000) {
    res.status(400);
    throw new Error("Scheduled time must be at least one minute in the future");
  }

  const userId = req.user._id;
  const stream = await Stream.create({
    userId,
    title: title.slice(0, 120),
    description: String(req.body.description || "")
      .trim()
      .slice(0, 1000),
    category: String(req.body.category || "Other")
      .trim()
      .slice(0, 60),
    tags: cleanTags(req.body.tags),
    isLive: false,
    isScheduled: true,
    scheduledAt: scheduledDate,
  });

  const user = await User.findById(userId);
  if (user) {
    await Promise.allSettled(
      (user.followers || []).map((followerId) =>
        createNotification({
          userId: followerId,
          fromUserId: userId,
          type: "stream_live",
          message: `${user.username} sẽ livestream "${stream.title}" vào ${scheduledDate.toLocaleString("vi-VN")}`,
          link: `/channel/${userId}`,
        }),
      ),
    );
  }

  res.status(201).json(serializeStream(stream));
});

const getScheduledStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find({
    isScheduled: true,
    isLive: false,
    scheduledAt: { $gte: new Date() },
  })
    .populate("userId", "username displayName avatar")
    .sort({ scheduledAt: 1 })
    .limit(20);
  res.status(200).json(streams.map(serializeStream));
});

const getScheduledStreamsByUser = asyncHandler(async (req, res) => {
  const streams = await Stream.find({
    userId: req.params.userId,
    isScheduled: true,
    isLive: false,
    scheduledAt: { $gte: new Date() },
  }).sort({ scheduledAt: 1 });
  res.status(200).json(streams.map(serializeStream));
});

const updateLiveStream = asyncHandler(async (req, res) => {
  const stream = await Stream.findOne({ userId: req.user._id, isLive: true });
  if (!stream) {
    res.status(404);
    throw new Error("No active stream found");
  }

  if (Object.hasOwn(req.body, "title")) {
    const title = String(req.body.title || "").trim();
    if (!title) {
      res.status(400);
      throw new Error("Title cannot be empty");
    }
    stream.title = title.slice(0, 120);
  }
  if (Object.hasOwn(req.body, "description")) {
    stream.description = String(req.body.description || "")
      .trim()
      .slice(0, 1000);
  }
  if (Object.hasOwn(req.body, "category")) {
    const category = String(req.body.category || "").trim();
    if (!category) {
      res.status(400);
      throw new Error("Category cannot be empty");
    }
    stream.category = category.slice(0, 60);
  }
  if (Object.hasOwn(req.body, "tags")) stream.tags = cleanTags(req.body.tags);
  await stream.save();

  req.app.get("io")?.to(`stream:${stream._id}`).emit("stream-info-updated", {
    title: stream.title,
    description: stream.description,
    category: stream.category,
    tags: stream.tags,
  });
  res.status(200).json(serializeStream(stream));
});

const getViewerList = asyncHandler(async (req, res) => {
  const viewers = await getViewersForStream(req.params.id);
  res.status(200).json({ viewerCount: viewers.length, viewers });
});

const getStreamAnalytics = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }
  if (
    !req.isAgent &&
    userId !== req.user?._id?.toString() &&
    req.user?.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view these analytics");
  }

  const streams = await Stream.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);
  const completedStreams = streams.filter(
    (stream) => stream.startedAt && stream.endedAt,
  );
  const totalHours = completedStreams.reduce(
    (sum, stream) =>
      sum + Math.max(0, (stream.endedAt - stream.startedAt) / 3_600_000),
    0,
  );
  const avgViewers = streams.length
    ? Math.round(
        streams.reduce((sum, stream) => sum + (stream.peakViewers || 0), 0) /
          streams.length,
      )
    : 0;
  const peakViewers = streams.reduce(
    (max, stream) => Math.max(max, stream.peakViewers || 0),
    0,
  );
  const viewerHistory = streams
    .slice(0, 10)
    .reverse()
    .map((stream) => ({
      date: new Date(stream.startedAt || stream.createdAt).toLocaleDateString(
        "vi-VN",
      ),
      viewers: stream.peakViewers || 0,
      duration:
        stream.startedAt && stream.endedAt
          ? Math.round(
              Math.max(0, (stream.endedAt - stream.startedAt) / 60_000),
            )
          : 0,
    }));
  const donationTotals = await Donation.aggregate([
    {
      $match: {
        toUserId: new mongoose.Types.ObjectId(userId),
        status: "completed",
      },
    },
    { $group: { _id: null, total: { $sum: "$coins" } } },
  ]);

  res.status(200).json({
    totalStreams: streams.length,
    totalHours: Math.round(totalHours * 10) / 10,
    avgViewers,
    peakViewers,
    totalCoinsReceived: donationTotals[0]?.total || 0,
    viewerHistory,
    // Raw, bounded history for the trusted scheduler agent. Keeping this
    // in the same response avoids a second analytics endpoint while the
    // browser dashboard can simply ignore the extra property.
    streams: streams.map((stream) => ({
      _id: stream._id,
      title: stream.title,
      category: stream.category,
      startedAt: stream.startedAt || stream.createdAt,
      endedAt: stream.endedAt || null,
      peakViewers: stream.peakViewers || 0,
      viewers: stream.viewers || 0,
    })),
  });
});

export {
  startStream,
  streamPublished,
  streamUnpublished,
  endStream,
  getLiveStreams,
  getCurrentStream,
  getStreamById,
  getStreamsByUser,
  getTopStreamersByHours,
  scheduleStream,
  getScheduledStreams,
  getScheduledStreamsByUser,
  updateLiveStream,
  getViewerList,
  getStreamAnalytics,
};
