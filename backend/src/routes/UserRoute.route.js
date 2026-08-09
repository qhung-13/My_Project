import { randomBytes, timingSafeEqual } from "node:crypto";
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
import createToken, { getAuthCookieOptions } from "../utils/createToken.js";
import { isGoogleOAuthConfigured } from "../config/passport.config.js";
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
router.post("/send-otp", authLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ==========================================
// 3. Google OAuth 2.0 Integration
// ==========================================
/**
 * Initiates the Google OAuth flow, requesting profile and email scopes.
 */
router.get("/auth/google", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ message: "Google OAuth is not configured" });
  }

  const state = randomBytes(24).toString("hex");
  res.cookie("oauth_state", state, {
    ...getAuthCookieOptions(),
    maxAge: 10 * 60 * 1000,
  });

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    prompt: "select_account",
  })(req, res, next);
});

/**
 * Handles the callback from Google after successful or failed authentication.
 * On success, generates a JWT token and redirects back to the React frontend.
 */
router.get(
  "/auth/google/callback",
  (req, res, next) => {
    const expected = String(req.cookies?.oauth_state || "");
    const received = String(req.query.state || "");
    res.clearCookie("oauth_state", getAuthCookieOptions());

    const validState =
      expected.length > 0 &&
      expected.length === received.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(received));

    if (!validState) {
      const frontendURL = (
        process.env.FRONTEND_URL || "http://localhost:5173"
      ).replace(/\/$/, "");
      return res.redirect(`${frontendURL}/auth/callback?status=failed`);
    }

    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}/auth/callback?status=failed`,
  }),
  (req, res) => {
    createToken(res, req.user._id);
    const frontendURL = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    res.redirect(`${frontendURL}/auth/callback?status=success`);
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
router.post("/verify-login-otp", authLimiter, verifyLoginOtp);
router.get("/:id", getUserById);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
// Route — cần protect middleware
export default router;
