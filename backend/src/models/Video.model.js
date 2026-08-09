import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    videoPublicId: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    thumbnailPublicId: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["public", "private", "processing"],
      default: "processing",
    },
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikesCount: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["clip", "vod"],
      default: "vod",
    },
    // Clips generated from a Cloudinary transformation still depend on the
    // source asset. Track that relationship so deleting a VOD can cascade its
    // derived clips instead of leaving broken playback URLs.
    sourceVideoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

videoSchema.index({ userId: 1, status: 1 });
videoSchema.index({ views: -1 });
videoSchema.index({ likesCount: -1 });
videoSchema.index({ category: 1, status: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ sourceVideoId: 1 });

const Video = mongoose.model("Video", videoSchema);
export default Video;
