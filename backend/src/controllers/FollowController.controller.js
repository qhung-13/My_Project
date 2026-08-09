import mongoose from "mongoose";
import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { createNotification } from "./NotificationController.controller.js";

const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;
  if (!mongoose.isValidObjectId(targetId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }
  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const target = await User.findOneAndUpdate(
        { _id: targetId, isActive: true, followers: { $ne: myId } },
        { $addToSet: { followers: myId }, $inc: { followersCount: 1 } },
        { new: true, session },
      ).select("_id");

      if (!target) {
        const exists = await User.exists({
          _id: targetId,
          isActive: true,
        }).session(session);
        const error = new Error(
          exists ? "You have already followed this user" : "User not found",
        );
        error.statusCode = exists ? 409 : 404;
        throw error;
      }

      const selfUpdate = await User.findOneAndUpdate(
        { _id: myId, following: { $ne: targetId } },
        { $addToSet: { following: targetId }, $inc: { followingCount: 1 } },
        { new: true, session },
      ).select("_id");

      if (!selfUpdate) {
        const error = new Error(
          "Follow state changed concurrently; please try again",
        );
        error.statusCode = 409;
        throw error;
      }
    });
  } finally {
    await session.endSession();
  }

  // Notification is a post-commit side effect; its failure must not roll back
  // an already-consistent follow relationship.
  try {
    await createNotification({
      userId: targetId,
      fromUserId: myId,
      type: "follow",
      message: `${req.user.displayName || req.user.username} đã follow bạn`,
      link: `/profile/${myId}`,
    });
  } catch (error) {
    console.error("Failed to create follow notification:", error.message);
  }

  res.status(200).json({ message: "Followed successfully" });
});

const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;
  if (!mongoose.isValidObjectId(targetId)) {
    res.status(400);
    throw new Error("Invalid user id");
  }
  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot unfollow yourself");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const target = await User.findOneAndUpdate(
        { _id: targetId, followers: myId },
        [
          { $set: { followers: { $setDifference: ["$followers", [myId]] } } },
          { $set: { followersCount: { $size: "$followers" } } },
        ],
        { new: true, session },
      ).select("_id");

      if (!target) {
        const exists = await User.exists({ _id: targetId }).session(session);
        const error = new Error(
          exists ? "You are not following this user" : "User not found",
        );
        error.statusCode = exists ? 409 : 404;
        throw error;
      }

      const selfUpdate = await User.findOneAndUpdate(
        { _id: myId, following: target._id },
        [
          {
            $set: {
              following: { $setDifference: ["$following", [target._id]] },
            },
          },
          { $set: { followingCount: { $size: "$following" } } },
        ],
        { new: true, session },
      ).select("_id");

      if (!selfUpdate) {
        const error = new Error(
          "Follow state changed concurrently; please refresh and try again",
        );
        error.statusCode = 409;
        throw error;
      }
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({ message: "Unfollowed successfully" });
});

const getFollowers = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }
  const user = await User.findById(req.params.id).populate(
    "followers",
    "username displayName avatar",
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user.followers);
});

const getFollowing = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }
  const user = await User.findById(req.params.id).populate(
    "following",
    "username displayName avatar",
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user.following);
});

export { followUser, unfollowUser, getFollowers, getFollowing };
