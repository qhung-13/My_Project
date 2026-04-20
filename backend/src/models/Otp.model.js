import mongoose from "mongoose";

/**
 * Mongoose schema and model for One-Time Passwords (OTPs)
 * Handles OTP storage for authentication flows and auto-deletes expired records via TTL index.
 *
 * @typedef {Object} Otp
 * @property {string} email - The email address associated with the OTP
 * @property {string} otp - The generated OTP string
 * @property {string} type - The purpose of the OTP (enum: "verify_email", "reset_password")
 * @property {Date} expiresAt - The expiration timestamp (defaults to 5 minutes from creation)
 */
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["verify_email", "reset_password"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  },
});

// Automatically delete the document when expiresAt time is reached (TTL Index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
