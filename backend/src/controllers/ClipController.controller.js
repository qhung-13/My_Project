import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import Video from "../models/Video.model.js";
import { v2 as cloudinary } from "cloudinary";

// ─────────────────────────────────────────────
// @desc    Create clip from VOD
// @route   POST /api/clips
// @access  Private
// ─────────────────────────────────────────────
const createClip = asyncHandler(async (req, res) => {
  const { videoId, startTime, endTime, title } = req.body;
  const userId = req.user._id;

  if (!videoId || startTime === undefined || endTime === undefined || !title) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  if (endTime - startTime < 5) {
    res.status(400);
    throw new Error("Clip must be at least 5 seconds");
  }

  if (endTime - startTime > 60) {
    res.status(400);
    throw new Error("Clip cannot exceed 60 seconds");
  }

  const sourceVideo = await Video.findById(videoId);
  if (!sourceVideo) {
    res.status(404);
    throw new Error("Video not found");
  }

  // Dùng Cloudinary transformation để cắt video
  // Cloudinary hỗ trợ trim video qua URL transformation
  const publicId = sourceVideo.videoUrl
    .split("/upload/")[1]
    .replace(/\.[^/.]+$/, ""); // Lấy public_id từ URL

  const clipUrl = cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [{ start_offset: startTime, end_offset: endTime }],
  });

  // Tạo video document mới cho clip
  const clip = new Video({
    userId,
    title,
    description: `Clip từ: ${sourceVideo.title}`,
    videoUrl: clipUrl,
    thumbnailUrl: sourceVideo.thumbnailUrl,
    duration: endTime - startTime,
    category: sourceVideo.category,
    tags: sourceVideo.tags,
    type: "clip",
    status: "public",
  });

  await clip.save();

  res.status(201).json(clip);
});

// ─────────────────────────────────────────────
// @desc    Get clips
// @route   GET /api/clips
// @access  Public
// ─────────────────────────────────────────────
const getClips = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const [clips, total] = await Promise.all([
    Video.find({ type: "clip", status: "public" })
      .populate("userId", "username displayName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Video.countDocuments({ type: "clip", status: "public" }),
  ]);

  res.status(200).json({
    clips,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
});

export { createClip, getClips };
