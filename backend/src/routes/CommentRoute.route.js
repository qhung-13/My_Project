import express from "express";
import {
  createComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../controllers/CommentController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.post("/:id", protect, createComment);
router.get("/:id", getComments);
router.delete("/:id", protect, deleteComment);
router.post("/:id/like", protect, likeComment);
router.post("/:id/unlike", protect, unlikeComment);

export default router;
