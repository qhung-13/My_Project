import { randomInt } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { buildObsStreamKey } from "../utils/ingestCredential.js";
import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import destroyCloudinaryAsset from "../utils/cloudinaryAssets.js";
import createToken, { getAuthCookieOptions } from "../utils/createToken.js";
import sendOtpEmail from "../utils/sendEmail.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeUsername = (value) => String(value || "").trim();
const generateOtp = () => randomInt(100000, 1000000).toString();

const serializeAuthUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName,
  avatar: user.avatar,
  bio: user.bio,
  coins: user.coins ?? 0,
  role: user.role || "user",
  bannerImage: user.bannerImage,
});

const createAndSendOtp = async (email, type) => {
  const otp = generateOtp();
  await Otp.deleteMany({ email, type });
  await Otp.create({ email, otp, type });
  await sendOtpEmail(email, otp, type);
};

const requireOtpFields = (email, otp, res) => {
  if (!email || !/^\d{6}$/.test(String(otp || ""))) {
    res.status(400);
    throw new Error("Email and a valid 6-digit OTP are required");
  }
};

const consumeOtp = (email, otp, type) =>
  Otp.findOneAndDelete({
    email,
    otp,
    type,
    expiresAt: { $gt: new Date() },
  });

const validatePassword = (password, res) => {
  if (typeof password !== "string" || password.length < 8) {
    res.status(400);
    throw new Error("Password must contain at least 8 characters");
  }
};

const normalizeOptionalHttpUrl = (value, fieldName, res) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized.length > 2048) {
    res.status(400);
    throw new Error(`${fieldName} URL is too long`);
  }
  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol))
      throw new Error("invalid protocol");
    return parsed.toString();
  } catch {
    res.status(400);
    throw new Error(`${fieldName} must be a valid HTTP or HTTPS URL`);
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!USERNAME_PATTERN.test(username)) {
    res.status(400);
    throw new Error(
      "Username must be 3-30 characters and contain only letters, numbers, or underscores",
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }
  validatePassword(password, res);

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    res.status(409);
    throw new Error(
      existing.email === email
        ? "Email already exists"
        : "Username already exists",
    );
  }

  const newUser = await User.create({ username, email, password });
  try {
    await createAndSendOtp(email, "verify_email");
  } catch (error) {
    // Avoid leaving an unusable account that makes the next registration
    // attempt fail with "email already exists" after SMTP temporarily fails.
    await Promise.allSettled([
      User.deleteOne({ _id: newUser._id, isVerified: false }),
      Otp.deleteMany({ email, type: "verify_email" }),
    ]);
    console.error("Registration OTP delivery failed:", error.message);
    res.status(503);
    throw new Error("Could not send the verification email. Please try again.");
  }

  res.status(201).json({
    message: "Account created. Please verify the OTP sent to your email.",
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
});

const userLogin = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const { password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required");
  }

  const existingUser = await User.findOne({ username }).select("+password");
  const isPasswordValid = existingUser
    ? await existingUser.comparePassword(password)
    : false;

  if (!existingUser || !isPasswordValid) {
    res.status(401);
    throw new Error("Invalid username or password");
  }
  if (!existingUser.isActive) {
    res.status(403);
    throw new Error("This account has been disabled");
  }
  if (!existingUser.isVerified) {
    res.status(403);
    throw new Error("Please verify your email before logging in");
  }

  await createAndSendOtp(existingUser.email, "login");
  res.status(200).json({
    message: "OTP has been sent to your email",
    email: existingUser.email,
  });
});

const sendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("Email does not exist");
  }
  if (user.isVerified) {
    res.status(409);
    throw new Error("Email is already verified");
  }

  await createAndSendOtp(email, "verify_email");
  res.status(200).json({ message: "OTP has been sent to your email" });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();
  requireOtpFields(email, otp, res);

  const otpRecord = await consumeOtp(email, otp, "verify_email");
  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true },
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  createToken(res, user._id);
  res.status(200).json({
    message: "Email verified successfully",
    ...serializeAuthUser(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  const user = await User.findOne({ email, isActive: true });
  if (user) {
    await createAndSendOtp(email, "reset_password");
  }

  // Do not reveal whether an account exists for this email.
  res.status(200).json({
    message: "If the account exists, a password reset OTP has been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();
  const { newPassword } = req.body;
  requireOtpFields(email, otp, res);
  validatePassword(newPassword, res);

  const otpRecord = await consumeOtp(email, otp, "reset_password");
  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("jwt", getAuthCookieOptions());
  res.status(200).json({ message: "Logged out successfully" });
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();
  requireOtpFields(email, otp, res);

  const otpRecord = await consumeOtp(email, otp, "login");
  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    res.status(401);
    throw new Error("Account is unavailable");
  }

  createToken(res, user._id);
  res.status(200).json(serializeAuthUser(user));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    ...serializeAuthUser(user),
    isVerified: user.isVerified,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (Object.hasOwn(req.body, "displayName")) {
    user.displayName = String(req.body.displayName || "")
      .trim()
      .slice(0, 50);
  }
  if (Object.hasOwn(req.body, "bio")) {
    user.bio = String(req.body.bio || "")
      .trim()
      .slice(0, 200);
  }
  if (Object.hasOwn(req.body, "avatar")) {
    user.avatar = normalizeOptionalHttpUrl(req.body.avatar, "Avatar", res);
  }
  if (Object.hasOwn(req.body, "bannerImage")) {
    user.bannerImage = normalizeOptionalHttpUrl(
      req.body.bannerImage,
      "Banner image",
      res,
    );
  }

  if (req.body.password) {
    validatePassword(req.body.password, res);
    if (user.password) {
      if (!req.body.currentPassword) {
        res.status(400);
        throw new Error("Please provide current password");
      }
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        res.status(401);
        throw new Error("Current password is incorrect");
      }
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save();
  res.json(serializeAuthUser(updatedUser));
});

const getUserById = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const user = /^[0-9a-fA-F]{24}$/.test(id)
    ? await User.findById(id)
    : await User.findOne({ username: id });

  if (!user || !user.isActive) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    followers: user.followers,
    bannerImage: user.bannerImage,
    isLive: user.isLive,
  });
});

const getRtmpServerUrl = () =>
  (process.env.RTMP_SERVER_URL || "rtmp://localhost:1935/live").replace(
    /\/+$/,
    "",
  );

const getStreamKey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+streamKey");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (!user.streamKey) {
    user.streamKey = uuidv4();
    await user.save();
  }
  const credential = buildObsStreamKey(user.streamKey);
  res.status(200).json({
    streamKey: credential.streamKey,
    streamKeyExpiresAt: credential.expiresAt,
    rtmpServerUrl: getRtmpServerUrl(),
  });
});

const resetStreamKey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+streamKey");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.isLive) {
    res.status(409);
    throw new Error(
      "Stop the active stream before regenerating the stream key",
    );
  }

  user.streamKey = uuidv4();
  await user.save();
  const credential = buildObsStreamKey(user.streamKey);
  res.status(200).json({
    streamKey: credential.streamKey,
    streamKeyExpiresAt: credential.expiresAt,
    rtmpServerUrl: getRtmpServerUrl(),
  });
});

const getTopUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .sort({ followersCount: -1 })
    .limit(5)
    .select("username displayName avatar followersCount");
  res.status(200).json(users);
});

const updateBanner = asyncHandler(async (req, res) => {
  const bannerUrl = req.file?.path;
  const bannerPublicId = req.file?.filename;
  if (!bannerUrl) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    await destroyCloudinaryAsset(bannerPublicId, "image");
    res.status(404);
    throw new Error("User not found");
  }

  const previousBannerPublicId = user.bannerPublicId;
  user.bannerImage = bannerUrl;
  user.bannerPublicId = bannerPublicId;
  try {
    await user.save();
  } catch (error) {
    await destroyCloudinaryAsset(bannerPublicId, "image");
    throw error;
  }
  await destroyCloudinaryAsset(previousBannerPublicId, "image");
  res.status(200).json({ bannerImage: user.bannerImage });
});

export {
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
};
