import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import asyncHandler from "./AsyncHandler.middleware.js";

/**
 * Middleware to protect routes by verifying JWT authentication
 * Extracts the token from cookies, verifies it, and attaches the authenticated user to the request object
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 401 - If token is missing, invalid, or the user is not found in the database
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    // BUG FIX: previously req.user could be `null` here (e.g. account
    // deleted after the token was issued) and the request was still allowed
    // through, letting downstream code crash on `req.user._id` or silently
    // treat the request as authenticated with no user.
    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error(error.message || "Not authorized, token failed");
  }
});

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as admin");
  }
};

export { protect as default, authorizeAdmin };
