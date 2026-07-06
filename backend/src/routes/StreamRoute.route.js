import express from "express";
import {
  startStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamsByUser,
  updateViewers,
  getTopStreamersByHours,
  scheduleStream,
  getScheduledStreams,
  getScheduledStreamsByUser,
} from "../controllers/StreamController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/", getLiveStreams);
router.get("/top-hours", getTopStreamersByHours);
router.post("/start", protect, startStream);
router.post("/end", protect, endStream);
router.get("/user/:userId", getStreamsByUser);
router.post("/schedule", protect, scheduleStream);
router.get("/scheduled", getScheduledStreams);
router.get("/scheduled/:userId", getScheduledStreamsByUser);
router.get("/:id", getStreamById);
router.put("/:id/viewers", protect, updateViewers);

export default router;
