import mongoose from "mongoose";

/**
 * Connect to MongoDB using the URI from environment variables
 * Exits the process if the connection fails
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    // Log the error and rethrow so the caller can decide how to shutdown gracefully
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

export default connectDB;
