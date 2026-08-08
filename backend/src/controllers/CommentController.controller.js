import mongoose from "mongoose";
import Comment from "../models/Comment.model.js";
import Video from "../models/Video.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";

const createComment = asyncHandler(async (req, res) => {
  const content = String(req.body.content || "").trim();
  if (!content) {
    res.status(400);
    throw new Error("Please enter a comment");
  }
  if (content.length > 1000) {
    res.status(400);
    throw new Error("Comment cannot exceed 1000 characters");
  }

  const video = await Video.findOne({
    _id: req.params.id,
    status: "public",
  }).select("_id");
  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  const comment = await Comment.create({
    userId: req.user._id,
    videoId: video._id,
    content,
  });
  await comment.populate("userId", "username displayName avatar");
  res.status(201).json(comment);
});

const getComments = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 50),
  );
  const comments = await Comment.find({ videoId: req.params.id })
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.status(200).json(comments);
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }
  if (
    comment.userId.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }
  await comment.deleteOne();
  res.status(200).json({ message: "Comment deleted successfully" });
});

const updateCommentLike = async (commentId, userId, shouldLike) => {
  const objectId = new mongoose.Types.ObjectId(userId);
  return Comment.findByIdAndUpdate(
    commentId,
    [
      {
        $set: {
          likes: shouldLike
            ? { $setUnion: ["$likes", [objectId]] }
            : { $setDifference: ["$likes", [objectId]] },
        },
      },
      { $set: { likesCount: { $size: "$likes" } } },
    ],
    { new: true },
  ).select("likes likesCount");
};

const likeComment = asyncHandler(async (req, res) => {
  const comment = await updateCommentLike(req.params.id, req.user._id, true);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }
  res
    .status(200)
    .json({
      message: "Comment liked successfully",
      likesCount: comment.likesCount,
    });
});

const unlikeComment = asyncHandler(async (req, res) => {
  const comment = await updateCommentLike(req.params.id, req.user._id, false);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }
  res
    .status(200)
    .json({
      message: "Comment unliked successfully",
      likesCount: comment.likesCount,
    });
});

export {
  createComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment,
};
