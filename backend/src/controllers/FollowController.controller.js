import User from "../models/User.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import { createNotification } from "./NotificationController.controller.js";

const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;
  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const target = await User.findOneAndUpdate(
    { _id: targetId, isActive: true, followers: { $ne: myId } },
    { $addToSet: { followers: myId }, $inc: { followersCount: 1 } },
    { new: true },
  ).select("_id");
  if (!target) {
    const exists = await User.exists({ _id: targetId, isActive: true });
    res.status(exists ? 409 : 404);
    throw new Error(
      exists ? "You have already followed this user" : "User not found",
    );
  }

  const selfUpdate = await User.findOneAndUpdate(
    { _id: myId, following: { $ne: targetId } },
    { $addToSet: { following: targetId }, $inc: { followingCount: 1 } },
  );
  if (!selfUpdate) {
    await User.findByIdAndUpdate(targetId, {
      $pull: { followers: myId },
      $inc: { followersCount: -1 },
    });
    res.status(409);
    throw new Error("Follow state changed concurrently; please try again");
  }

  await createNotification({
    userId: targetId,
    fromUserId: myId,
    type: "follow",
    message: `${req.user.displayName || req.user.username} đã follow bạn`,
    link: `/profile/${myId}`,
  });
  res.status(200).json({ message: "Followed successfully" });
});

const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user._id;
  if (targetId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot unfollow yourself");
  }

  const target = await User.findOneAndUpdate(
    { _id: targetId, followers: myId },
    [
      { $set: { followers: { $setDifference: ["$followers", [myId]] } } },
      { $set: { followersCount: { $size: "$followers" } } },
    ],
    { new: true },
  );
  if (!target) {
    const exists = await User.exists({ _id: targetId });
    res.status(exists ? 409 : 404);
    throw new Error(
      exists ? "You are not following this user" : "User not found",
    );
  }

  await User.findByIdAndUpdate(myId, [
    { $set: { following: { $setDifference: ["$following", [target._id]] } } },
    { $set: { followingCount: { $size: "$following" } } },
  ]);
  res.status(200).json({ message: "Unfollowed successfully" });
});

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
