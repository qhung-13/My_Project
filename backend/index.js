/**
 * @fileoverview Main entry point for the OmexLive backend API.
 * Initializes the Express server, connects to MongoDB, configures global middlewares,
 * and mounts the API routes.
 */

// Core & Third-party Packages
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";

// Configurations & Utilities
import connectDB from "./src/config/db.config.js";
import configurePassport from "./src/config/passport.config.js";
import configureCloudinary from "./src/config/cloudinary.config.js";

// Routes
import userRoute from "./src/routes/UserRoute.route.js";
import videoRoute from "./src/routes/VideoRoute.route.js";

// ==========================================
// Initialization & Database Connection
// ==========================================
dotenv.config(); // Load environment variables from .env file
configurePassport(); // Initialize Passport OAuth strategies
configureCloudinary(); // Cloudinary
connectDB(); // Establish connection to MongoDB

const app = express();
const port = process.env.PORT || 5000;

// ==========================================
// Global Middlewares
// ==========================================
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads
app.use(cookieParser()); // Parse Cookie header and populate req.cookies
app.use(
  cors({
    origin: [
      "https://my-project-omega-roan.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(passport.initialize()); // Initialize Passport for authentication

// ==========================================
// API Routes
// ==========================================
app.use("/api/users", userRoute);
app.use("/api/videos", videoRoute);

// ==========================================
// Server Startup
// ==========================================
app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
