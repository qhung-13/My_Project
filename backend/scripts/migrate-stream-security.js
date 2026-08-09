import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import User from "../src/models/User.model.js";
import Stream from "../src/models/Stream.model.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({ streamKey: { $ne: null } }).select(
    "+streamKey",
  );

  for (const user of users) {
    user.streamKey = uuidv4();
    user.isLive = false;
    await user.save();
  }

  await Stream.updateMany(
    {},
    {
      $unset: { streamKey: "" },
      $set: { isLive: false, viewers: 0 },
    },
  );

  console.log(
    `Rotated ${users.length} OBS ingest key(s), removed legacy stream credentials, and marked existing sessions offline.`,
  );
} finally {
  await mongoose.disconnect();
}
