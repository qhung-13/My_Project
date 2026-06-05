import asyncHandler from "./AsyncHandler.middleware.js";

const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Admin only.");
  }
});

export default adminOnly;
