import mongoose from "mongoose";
import { type } from "node:os";

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
  },
  {
    timestamps: true,
  },
);

donationSchema.index({ fromUserId: 1, createdAt: -1 });
donationSchema.index({ toUserId: 1, createdAt: -1 });

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;
