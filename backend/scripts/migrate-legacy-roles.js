import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.model.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { role: "stream" },
    { $set: { role: "streamer" } },
  );
  console.log(`Migrated ${result.modifiedCount} legacy streamer role(s).`);
} catch (error) {
  console.error("Role migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
