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
  searchVideos,
  dislikeVideo,
  undislikeVideo,
  increaseView,
} from "../controllers/VideoController.controller.js";
import protect from "../middlewares/Auth.middleware.js";
import { uploadVideo, uploadImage } from "../config/cloudinary.config.js";

const router = express.Router();

router.get("/", getVideos);
router.post(
  "/",
  protect,
  uploadVideo.single("video"), // Upload video file
  createVideo,
);
router.get("/search", searchVideos);
router.get("/user/:userId", getVideosByUser);
router.get("/:id", getVideoById);
router.put("/:id/view", increaseView);
router.put(
  "/:id",
  protect,
  uploadImage.single("thumbnail"), // Upload thumbnail
  updateVideo,
);
router.delete("/:id", protect, deleteVideo);
router.post("/:id/like", protect, likeVideo);
router.post("/:id/unlike", protect, unlikeVideo);
router.post("/:id/dislike", protect, dislikeVideo);
router.post("/:id/undislike", protect, undislikeVideo);

export default router;
