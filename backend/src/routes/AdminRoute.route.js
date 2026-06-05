import express from "express";
import {
  getStats,
  getAllUsers,
  updateUserRole,
  toggleBanUser,
  getAllVideos,
  deleteVideo,
  getAllStreams,
} from "../controllers/AdminController.controller.js";
import protect from "../middlewares/Auth.middleware.js";
import adminOnly from "../middlewares/Admin.middleware.js";

const router = express.Router();

// Tất cả routes đều cần login + admin
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/ban", toggleBanUser);
router.get("/videos", getAllVideos);
router.delete("/videos/:id", deleteVideo);
router.get("/streams", getAllStreams);

export default router;
