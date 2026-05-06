import Video from "../models/Video.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";

// ─────────────────────────────────────────────
// @desc    Create a new video
// @route   POST /api/videos
// @access  Private
// ─────────────────────────────────────────────
const createVideo = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    videoUrl,
    thumbnailUrl,
    duration,
    category,
    tags,
  } = req.body;
  const userId = req.user._id;

  if (
    !title ||
    !description ||
    !videoUrl ||
    !thumbnailUrl ||
    !duration ||
    !category
  ) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const newVideo = new Video({
    userId,
    title,
    description,
    videoUrl,
    thumbnailUrl,
    duration,
    category,
    tags: tags || [],
  });

  await newVideo.save();

  res.status(201).json({
    _id: newVideo._id,
    userId: newVideo.userId,
    title: newVideo.title,
    description: newVideo.description,
    videoUrl: newVideo.videoUrl,
    thumbnailUrl: newVideo.thumbnailUrl,
    duration: newVideo.duration,
    category: newVideo.category,
    tags: newVideo.tags,
    status: newVideo.status,
  });
});

// ─────────────────────────────────────────────
// @desc    Get all public videos
// @route   GET /api/videos
// @access  Public
// ─────────────────────────────────────────────
const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ status: "public" })
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(videos);
});

// ─────────────────────────────────────────────
// @desc    Get a single video by ID
// @route   GET /api/videos/:id
// @access  Public
// ─────────────────────────────────────────────
const getVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate(
    "userId",
    "username displayName avatar",
  );

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  // Tăng view count
  video.views += 1;
  await video.save();

  res.status(200).json(video);
});

// ─────────────────────────────────────────────
// @desc    Get videos by user ID
// @route   GET /api/videos/user/:userId
// @access  Public
// ─────────────────────────────────────────────
const getVideosByUser = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    userId: req.params.userId,
    status: "public",
  }).sort({ createdAt: -1 });

  res.status(200).json(videos);
});

// ─────────────────────────────────────────────
// @desc    Update a video
// @route   PUT /api/videos/:id
// @access  Private
// ─────────────────────────────────────────────
const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  // Chỉ chủ video mới được update
  if (video.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this video");
  }

  video.title = req.body.title || video.title;
  video.description = req.body.description || video.description;
  video.thumbnailUrl = req.body.thumbnailUrl || video.thumbnailUrl;
  video.category = req.body.category || video.category;
  video.tags = req.body.tags || video.tags;
  video.status = req.body.status || video.status;

  const updatedVideo = await video.save();
  res.status(200).json(updatedVideo);
});

// ─────────────────────────────────────────────
// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  // Chỉ chủ video mới được xóa
  if (video.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this video");
  }

  await video.deleteOne();
  res.status(200).json({ message: "Video deleted successfully" });
});

// ─────────────────────────────────────────────
// @desc    Like a video
// @route   POST /api/videos/:id/like
// @access  Private
// ─────────────────────────────────────────────
const likeVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const alreadyLiked = video.likes.some(
    (id) => id.toString() === req.user._id.toString(),
  );

  if (alreadyLiked) {
    res.status(400);
    throw new Error("You have already liked this video");
  }

  await Video.findByIdAndUpdate(req.params.id, {
    $push: { likes: req.user._id },
    $inc: { likesCount: 1 },
  });

  res.status(200).json({ message: "Video liked successfully" });
});

// ─────────────────────────────────────────────
// @desc    Unlike a video
// @route   POST /api/videos/:id/unlike
// @access  Private
// ─────────────────────────────────────────────
const unlikeVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const alreadyLiked = video.likes.some(
    (id) => id.toString() === req.user._id.toString(),
  );

  if (!alreadyLiked) {
    res.status(400);
    throw new Error("You have not liked this video");
  }

  await Video.findByIdAndUpdate(req.params.id, {
    $pull: { likes: req.user._id },
    $inc: { likesCount: -1 },
  });

  res.status(200).json({ message: "Video unliked successfully" });
});

export {
  createVideo,
  getVideos,
  getVideoById,
  getVideosByUser,
  updateVideo,
  deleteVideo,
  likeVideo,
  unlikeVideo,
};
