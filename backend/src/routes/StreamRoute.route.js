import express from "express";
import {
  startStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamsByUser,
  updateViewers,
} from "../controllers/StreamController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/", getLiveStreams);
router.post("/start", protect, startStream);
router.post("/end", protect, endStream);
router.get("/user/:userId", getStreamsByUser);
router.get("/:id", getStreamById);
router.put("/:id/viewers", protect, updateViewers);

export default router;
