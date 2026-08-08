import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import Video from "../models/Video.model.js";
import { v2 as cloudinary } from "cloudinary";

const paginationFrom = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 12),
  );
  return { page, limit, skip: (page - 1) * limit };
};

const getCloudinaryPublicId = (url) => {
  if (typeof url !== "string" || !url.includes("/upload/")) return null;
  const afterUpload = url.split("/upload/")[1];
  return afterUpload.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
};

const createClip = asyncHandler(async (req, res) => {
  const videoId = String(req.body.videoId || "").trim();
  const startTime = Number(req.body.startTime);
  const endTime = Number(req.body.endTime);
  const title = String(req.body.title || "").trim();

  if (
    !videoId ||
    !title ||
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime)
  ) {
    res.status(400);
    throw new Error("Video, title, and valid start/end times are required");
  }
  if (startTime < 0 || endTime <= startTime) {
    res.status(400);
    throw new Error("Invalid clip time range");
  }

  const clipDuration = endTime - startTime;
  if (clipDuration < 5 || clipDuration > 60) {
    res.status(400);
    throw new Error("Clip duration must be between 5 and 60 seconds");
  }

  const sourceVideo = await Video.findOne({ _id: videoId, status: "public" });
  if (!sourceVideo) {
    res.status(404);
    throw new Error("Video not found");
  }
  if (sourceVideo.duration > 0 && endTime > sourceVideo.duration) {
    res.status(400);
    throw new Error("Clip end time exceeds the source video duration");
  }

  const publicId = getCloudinaryPublicId(sourceVideo.videoUrl);
  if (!publicId) {
    res.status(422);
    throw new Error("This video source does not support server-side clipping");
  }

  const clipUrl = cloudinary.url(publicId, {
    resource_type: "video",
    secure: true,
    transformation: [{ start_offset: startTime, end_offset: endTime }],
  });

  const clip = await Video.create({
    userId: req.user._id,
    title: title.slice(0, 150),
    description: `Clip từ: ${sourceVideo.title}`,
    videoUrl: clipUrl,
    thumbnailUrl: sourceVideo.thumbnailUrl,
    duration: clipDuration,
    category: sourceVideo.category,
    tags: sourceVideo.tags,
    type: "clip",
    status: "public",
  });
  res.status(201).json(clip);
});

const getClips = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationFrom(req.query);
  const filter = { type: "clip", status: "public" };
  const [clips, total] = await Promise.all([
    Video.find(filter)
      .populate("userId", "username displayName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Video.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    clips,
    pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
  });
});

export { createClip, getClips };
