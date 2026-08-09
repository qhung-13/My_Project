import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coins: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      default: "",
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    idempotencyKey: {
      type: String,
      default: null,
      maxlength: 128,
    },
  },
  {
    timestamps: true,
  },
);

donationSchema.index({ fromUserId: 1, createdAt: -1 });
donationSchema.index(
  { fromUserId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
donationSchema.index({ toUserId: 1, createdAt: -1 });

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;
