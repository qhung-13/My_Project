import express from "express";
import {
  startStream,
  streamPublished,
  streamUnpublished,
  endStream,
  getLiveStreams,
  getCurrentStream,
  getStreamById,
  getStreamsByUser,
  getTopStreamersByHours,
  scheduleStream,
  getScheduledStreams,
  getScheduledStreamsByUser,
  updateLiveStream,
  getViewerList,
  getStreamAnalytics,
} from "../controllers/StreamController.controller.js";
import protect, { protectOrAgent } from "../middlewares/Auth.middleware.js";
import requireMediaService from "../middlewares/MediaServiceAuth.middleware.js";

const router = express.Router();

router.get("/", getLiveStreams);
router.get("/top-hours", getTopStreamersByHours);
router.post("/internal/publish", requireMediaService, streamPublished);
router.post("/internal/unpublish", requireMediaService, streamUnpublished);
router.post("/start", protect, startStream);
router.post("/end", protect, endStream);
router.put("/live/update", protect, updateLiveStream);
router.get("/me/current", protect, getCurrentStream);
router.get("/user/:userId", getStreamsByUser);
router.get("/analytics/:userId", protectOrAgent, getStreamAnalytics);
router.post("/schedule", protect, scheduleStream);
router.get("/scheduled", getScheduledStreams);
router.get("/scheduled/:userId", getScheduledStreamsByUser);
router.get("/:id", getStreamById);
router.get("/:id/viewers", getViewerList);

export default router;
