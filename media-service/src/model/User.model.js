import mongoose from "mongoose";

const minimalUserSchema = new mongoose.Schema(
  {
    streamKey: String,
    isLive: Boolean,
  },
  { collection: "users", strict: false },
);

const User = mongoose.model("User", minimalUserSchema);

export default User;
