import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import createToken from "../utils/createToken.js";
import Otp from "../models/Otp.model.js";
import sendOtpEmail from "../utils/sendEmail.js";

// Note: Removed unused import { compare } from "bcryptjs"
// comparePassword is already handled by the User model method

// ─────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
// ─────────────────────────────────────────────
const userRegister = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  // Check if username already exists
  const userExist = await User.findOne({ username });
  if (userExist) {
    res.status(400);
    throw new Error("User already exists");
  }

  const newUser = new User({ username, email, password });
  await newUser.save();

  createToken(res, newUser._id);

  res.status(201).json({
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
});

// ─────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/users/login
// @access  Public
// ─────────────────────────────────────────────
const userLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user and explicitly select password (hidden by default)
  const existingUser = await User.findOne({ username }).select("+password");
  if (!existingUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Validate password using model method
  const isPasswordValid = await existingUser.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid password");
  }

  createToken(res, existingUser._id);

  res.status(200).json({
    _id: existingUser._id,
    username: existingUser.username,
  });
});

// ─────────────────────────────────────────────
// @desc    Send OTP to email for verification
// @route   POST /api/users/send-otp
// @access  Public
// ─────────────────────────────────────────────
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if email exists in DB
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("Email does not exist");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove any existing OTP for this email
  await Otp.deleteMany({ email, type: "verify_email" });

  // Save new OTP to DB
  await Otp.create({ email, otp, type: "verify_email" });

  // Send OTP via email
  await sendOtpEmail(email, otp, "verify_email");

  res.status(200).json({ message: "OTP has been sent to your email" });
});

// ─────────────────────────────────────────────
// @desc    Verify OTP and activate account
// @route   POST /api/users/verify-otp
// @access  Public
// ─────────────────────────────────────────────
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Find OTP record in DB
  const otpExist = await Otp.findOne({ email, type: "verify_email" });
  if (!otpExist) {
    res.status(404);
    throw new Error("Invalid OTP");
  }

  // Check if OTP has expired
  if (otpExist.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP has expired");
  }

  // Compare OTP from body with OTP in DB
  if (otp !== otpExist.otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  // Mark user as verified and clean up OTP
  await User.findOneAndUpdate({ email }, { isVerified: true });
  await Otp.deleteMany({ email, type: "verify_email" });

  res.status(200).json({ message: "Email verified successfully" });
});

// ─────────────────────────────────────────────
// @desc    Send OTP to email for password reset
// @route   POST /api/users/forgot-password
// @access  Public
// ─────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove any existing reset OTP for this email
  await Otp.deleteMany({ email, type: "reset_password" });

  // Save new OTP to DB
  await Otp.create({ email, otp, type: "reset_password" });

  // Send OTP via email
  await sendOtpEmail(email, otp, "reset_password");

  res
    .status(200)
    .json({ message: "Password reset OTP has been sent to your email" });
});

// ─────────────────────────────────────────────
// @desc    Reset password using OTP
// @route   POST /api/users/reset-password
// @access  Public
// ─────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Find OTP record in DB
  const isValidOtp = await Otp.findOne({ email, type: "reset_password" });
  if (!isValidOtp) {
    res.status(404);
    throw new Error("OTP not found");
  }

  // Check if OTP has expired
  if (isValidOtp.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP has expired");
  }

  // Compare OTP
  if (otp !== isValidOtp.otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  // Update password — pre('save') hook will hash it automatically
  const user = await User.findOne({ email });
  user.password = newPassword;
  await user.save();

  // Clean up OTP after successful reset
  await Otp.deleteMany({ email, type: "reset_password" });

  res.status(200).json({ message: "Password reset successfully" });
});

// ─────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
// ─────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  // Clear JWT cookie by setting it to empty with past expiry
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const getProfile = asyncHandler(async (req, res) => {});

export {
  userRegister,
  userLogin,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
};
