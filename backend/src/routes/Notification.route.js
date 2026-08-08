import express from "express";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  createScheduleAnnouncement,
} from "../controllers/NotificationController.controller.js";
import protect, { protectOrAgent } from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.post(
  "/schedule-announcement",
  protectOrAgent,
  createScheduleAnnouncement,
);
router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);

export default router;
