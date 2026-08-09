import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import asyncHandler from "./AsyncHandler.middleware.js";

const safeCompare = (provided, expected) => {
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && timingSafeEqual(left, right);
};

const resolveUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.userId).select("-password");
};

const protect = asyncHandler(async (req, res, next) => {
  const cookieToken = req.cookies?.jwt;
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const user = await resolveUserFromToken(token);
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("Not authorized, account unavailable");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error(error.message || "Not authorized, token failed");
  }
});

/** Allows either a normal authenticated user or the trusted internal agent. */
const protectOrAgent = asyncHandler(async (req, res, next) => {
  const suppliedSecret = req.get("x-agent-secret");
  const configuredSecret = process.env.AGENT_SERVICE_SECRET;

  if (configuredSecret && safeCompare(suppliedSecret, configuredSecret)) {
    req.isAgent = true;
    return next();
  }

  return protect(req, res, next);
});

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  res.status(403);
  throw new Error("Not authorized as admin");
};

export { protect as default, protectOrAgent, authorizeAdmin };
