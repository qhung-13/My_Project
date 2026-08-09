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
      default: "",
      maxlength: 1000,
    },
    category: { type: String, required: true },
    tags: [{ type: String }],
    // Legacy ingest credential. Kept temporarily so old documents can be
    // migrated, but never selected by normal queries or exposed publicly.
    streamKey: {
      type: String,
      default: null,
      select: false,
    },
    // Public, per-live-session playback identifier. This MUST be different
    // from the OBS ingest key so viewers can never recover publish credentials
    // from an HLS URL.
    playbackId: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    lastMediaHeartbeatAt: {
      type: Date,
      default: null,
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

streamSchema.index(
  { playbackId: 1 },
  {
    unique: true,
    partialFilterExpression: { playbackId: { $type: "string" } },
  },
);
streamSchema.index({
  isLive: 1,
  lastMediaHeartbeatAt: 1,
  viewers: -1,
});
streamSchema.index({ userId: 1 });
streamSchema.index({ createdAt: -1 });

const Stream = mongoose.model("Stream", streamSchema);
export default Stream;
