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
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  // Verify token
  const decode = jwt.verify(token, process.env.JWT_SECRET);

  // Find user in database and exclude the password field
  const user = await User.findById(decode.userId).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  // Attach the authenticated user to the request object
  req.user = user;
  next();
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
