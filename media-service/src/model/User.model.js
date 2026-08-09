import mongoose from "mongoose";

const minimalUserSchema = new mongoose.Schema(
  {
    username: String,
    streamKey: String,
    isLive: Boolean,
    isActive: { type: Boolean, default: true },
  },
  { collection: "users", strict: false },
);

const User = mongoose.model("User", minimalUserSchema);

export default User;
