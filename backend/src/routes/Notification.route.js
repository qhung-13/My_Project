import express from "express";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/NotificationController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);

export default router;
