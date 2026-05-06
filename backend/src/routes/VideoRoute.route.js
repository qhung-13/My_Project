import express from "express";
import {
  createVideo,
  getVideos,
  getVideoById,
  getVideosByUser,
  updateVideo,
  deleteVideo,
  likeVideo,
  unlikeVideo,
} from "../controllers/VideoController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/", getVideos);
router.post("/", protect, createVideo);
router.get("/user/:userId", getVideosByUser);
router.get("/:id", getVideoById);
router.put("/:id", protect, updateVideo);
router.delete("/:id", protect, deleteVideo);
router.post("/:id/like", protect, likeVideo);
router.post("/:id/unlike", protect, unlikeVideo);

export default router;
