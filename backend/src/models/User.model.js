import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Mongoose schema and model for Users
 * Represents a user in the system, handling standard authentication, OAuth, profile data, and roles.
 *
 * @typedef {Object} User
 * @property {string} username - Unique username, strictly alphanumeric and underscores (3-30 chars)
 * @property {string} email - Unique, validated email address
 * @property {string} [password] - Hashed password (excluded from default queries)
 * @property {string} [googleId] - OAuth Google ID
 * @property {string} [facebookId] - OAuth Facebook ID
 * @property {string} [displayName] - User's display name (max 50 chars)
 * @property {string} [avatar] - URL to the user's avatar image
 * @property {string} [bio] - Short biography (max 200 chars)
 * @property {string} [refreshToken] - JWT refresh token (excluded from default queries)
 * @property {string} role - User role (enum: "user", "stream" (legacy), "streamer", "admin")
 * @property {boolean} isVerified - Indicates if the user's email is verified
 * @property {boolean} isActive - Indicates if the account is active/unbanned
 * @property {Date} createdAt - Automatically generated creation timestamp
 * @property {Date} updatedAt - Automatically generated update timestamp
 */
const userSchema = new mongoose.Schema(
  {
    // -------- Normal Information -----------------------------------
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, "Username chỉ được chứa chữ, số và dấu _"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },

    // -------- OAuth -----------------------------------
    googleId: {
      type: String,
      default: null,
    },
    facebookId: {
      type: String,
      default: null,
    },

    // -------- Profile -----------------------------------
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },

    // -------- Auth & Security -----------------------------------
    refreshToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "stream", "streamer", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // -------- Follow --------------------------------------------
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },

    // ------ Stream Key --------------
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      // OBS ingest credentials are private by default. Endpoints that need to
      // reveal/use the key must opt in with `.select("+streamKey")`.
      select: false,
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    coins: {
      type: Number,
      default: 0,
    },

    bannerImage: {
      type: String,
      default: null,
    },
    bannerPublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // auto create createdAt & updatedAt
  },
);

/**
 * Pre-save middleware to hash the user's password before saving to the database.
 * Only runs if the password field has been modified.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Compares a plain text password with the user's hashed password in the database.
 *
 * @param {string} candidatePassword - The plain text password to verify
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for faster OAuth lookups
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });

userSchema.index({ followersCount: -1 });

const User = mongoose.model("User", userSchema);

export default User;
