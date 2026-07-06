import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
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
    category: { type: String, required: true },
    tags: [{ type: String }],
    streamKey: {
      type: String,
      unique: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    viewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    vodUrl: {
      type: String,
      default: "",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

streamSchema.index({ isLive: 1, viewers: -1 });
streamSchema.index({ userId: 1 });
streamSchema.index({ streamKey: 1 }, { unique: true, sparse: true });
streamSchema.index({ createdAt: -1 });

const Stream = mongoose.model("Stream", streamSchema);
export default Stream;
