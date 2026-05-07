import Comment from "../models/Comment.model.js";
import Video from "../models/Video.model.js";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";

// ─────────────────────────────────────────────
// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
// ─────────────────────────────────────────────
const createComment = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  const { content } = req.body;
  const userId = req.user._id;

  const video = await Video.findById(videoId);
  if (!video) {
    res.status(404);
    throw new Error("Video not found");
  }

  if (!content) {
    res.status(400);
    throw new Error("Please enter a comment");
  }

  const newComment = new Comment({
    userId,
    videoId,
    content,
  });

  await newComment.save();

  res.status(201).json({
    _id: newComment._id,
    userId: newComment.userId,
    videoId: newComment.videoId,
    content: newComment.content,
  });
});

// ─────────────────────────────────────────────
// @desc    Get all public comment
// @route   POST /api/comments
// @access  Public
// ─────────────────────────────────────────────
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ videoId: req.params.id })
    .populate("userId", "username displayName avatar")
    .sort({ createdAt: -1 });

  res.status(200).json(comments);
});

// ─────────────────────────────────────────────
// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }
  await comment.deleteOne();
  res.status(200).json({ message: "Comment delete successfully" });
});

// ─────────────────────────────────────────────
// @desc    Like a comment
// @route   DELETE /api/comments/:id/like
// @access  Private
// ─────────────────────────────────────────────
const likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const alreadyLiked = comment.likes.some(
    (id) => id.toString() === req.user._id.toString(),
  );

  if (alreadyLiked) {
    res.status(400);
    throw new Error("You have already liked this comment");
  }

  await Comment.findByIdAndUpdate(req.params.id, {
    $push: { likes: req.user._id },
    $inc: { likesCount: 1 },
  });

  res.status(200).json({ message: "Comment liked successfully" });
});

// ─────────────────────────────────────────────
// @desc    Unlike a comment
// @route   DELETE /api/comments/:id/unlike
// @access  Private
// ─────────────────────────────────────────────
const unlikeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const alreadyLiked = comment.likes.some(
    (id) => id.toString() === req.user._id.toString(),
  );

  if (!alreadyLiked) {
    res.status(400);
    throw new Error("You have not liked this comment");
  }

  await Comment.findByIdAndUpdate(req.params.id, {
    $pull: { likes: req.user._id },
    $inc: { likesCount: -1 },
  });

  res.status(200).json({ message: "Comment unliked successfully" });
});

export {
  createComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment,
};
