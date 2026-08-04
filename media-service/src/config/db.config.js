import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[media-service] Connected to MongoDB");
  } catch (error) {
    console.error("[media-service] MongoDB connection error:", error.message);
    throw error;
  }
};

export default connectDB;
