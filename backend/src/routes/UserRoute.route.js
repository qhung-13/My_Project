import express from "express";
import passport from "passport";
import {
  userRegister,
  userLogin,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  verifyLoginOtp,
  updateProfile,
  getUserById,
  getStreamKey,
  resetStreamKey,
  getTopUsers,
  updateBanner,
} from "../controllers/UserController.controller.js";
import createToken from "../utils/createToken.js";
import { generateToken } from "../utils/createToken.js";
import protect from "../middlewares/Auth.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/FollowController.controller.js";
import { authLimiter } from "../middlewares/RateLimiting.middleware.js";
import { uploadImage } from "../config/cloudinary.config.js";

const router = express.Router();

/**
 * @module routes/UserRoutes
 * @description Defines all API routes related to user authentication, authorization, and profile management.
 */

// ==========================================
// 1. Local Authentication & Management
// ==========================================
router.post("/register", authLimiter, userRegister);
router.post("/login", authLimiter, userLogin);
router.post("/logout", logout);

// ==========================================
// 2. OTP & Password Recovery
// ==========================================
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ==========================================
// 3. Google OAuth 2.0 Integration
// ==========================================
/**
 * Initiates the Google OAuth flow, requesting profile and email scopes.
 */
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

/**
 * Handles the callback from Google after successful or failed authentication.
 * On success, generates a JWT token and redirects back to the React frontend.
 */
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect:
      process.env.NODE_ENV === "production"
        ? "https://my-project-omega-roan.vercel.app/home"
        : "http://localhost:5173/home",
  }),
  (req, res) => {
    const token = generateToken(req.user._id);

    const frontendURL =
      process.env.NODE_ENV === "production"
        ? "https://my-project-omega-roan.vercel.app"
        : "http://localhost:5173";

    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "Redirecting to:",
      `${frontendURL}/auth/callback?token=${token}`,
    );

    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  },
);

// ==========================================
// 4. Protected Routes
// ==========================================
/**
 * Retrieves the profile of the currently authenticated user.
 * Requires a valid JWT token via the 'protect' middleware.
 */
router.get("/top", getTopUsers);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put(
  "/profile/banner",
  protect,
  uploadImage.single("banner"),
  updateBanner,
);
router.get("/stream-key", protect, getStreamKey);
router.post("/stream-key/reset", protect, resetStreamKey);
router.post("/verify-login-otp", verifyLoginOtp);
router.get("/:id", getUserById);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
// Route — cần protect middleware
export default router;
