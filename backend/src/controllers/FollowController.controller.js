import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { createNotification } from "./Notification.controller.js";

// ─────────────────────────────────────────────
// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
// ─────────────────────────────────────────────
const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;

  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const alreadyFollowed = targetUser.followers.includes(myId);
  if (alreadyFollowed) {
    res.status(400);
    throw new Error("You have already followed this user");
  }

  await User.findByIdAndUpdate(targetId, {
    $push: { followers: myId },
    $inc: { followersCount: 1 },
  });

  await User.findByIdAndUpdate(myId, {
    $push: { following: targetId },
    $inc: { followingCount: 1 },
  });

  await createNotification({
    userId: targetUser._id, 
    fromUserId: myId, 
    type: "follow",
    message: `${req.user.username} đã follow bạn`,
    link: `/profile/${myId}`,
  });

  res.status(200).json({ message: "Followed successfully" });
});

// ─────────────────────────────────────────────
// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
// ─────────────────────────────────────────────
const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;

  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot unfollow yourself");
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const isFollowing = targetUser.followers.some(
    (id) => id.toString() === myId.toString(),
  );
  if (!isFollowing) {
    res.status(400);
    throw new Error("You are not following this user");
  }

  await User.findByIdAndUpdate(targetId, {
    $pull: { followers: myId },
    $inc: { followersCount: -1 },
  });

  await User.findByIdAndUpdate(myId, {
    $pull: { following: targetId },
    $inc: { followingCount: -1 },
  });

  res.status(200).json({ message: "Unfollowed successfully" });
});

// ─────────────────────────────────────────────
// @desc    Get followers of a user
// @route   GET /api/users/:id/followers
// @access  Public
// ─────────────────────────────────────────────
const getFollowers = asyncHandler(async (req, res) => {
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

// ─────────────────────────────────────────────
// @desc    Get following of a user
// @route   GET /api/users/:id/following
// @access  Public
// ─────────────────────────────────────────────
const getFollowing = asyncHandler(async (req, res) => {
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
