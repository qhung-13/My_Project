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
} from "../controllers/UserController.controller.js";
import createToken from "../utils/createToken.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

/**
 * @module routes/UserRoutes
 * @description Defines all API routes related to user authentication, authorization, and profile management.
 */

// ==========================================
// 1. Local Authentication & Management
// ==========================================
router.post("/register", userRegister);
router.post("/login", userLogin);
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
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Generate JWT token and set it in cookies via utility function
    createToken(res, req.user._id);

    // Redirect to the frontend application
    res.redirect("http://localhost:5173");
  },
);

// ==========================================
// 4. Protected Routes
// ==========================================
/**
 * Retrieves the profile of the currently authenticated user.
 * Requires a valid JWT token via the 'protect' middleware.
 */
router.get("/profile", protect, getProfile);

export default router;
