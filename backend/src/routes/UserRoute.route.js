import express from "express";
import {
  userRegister,
  userLogin,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
  getProfile
} from "../controllers/UserController.controller.js";
import passport from "passport";
import createToken from "../utils/createToken.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();
router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    createToken(res, req.user._id);
    res.redirect("http://localhost:5173");
  },
);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);

export default router;
