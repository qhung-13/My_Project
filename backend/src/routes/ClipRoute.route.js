import express from "express";
import {
  createClip,
  getClips,
} from "../controllers/ClipController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/", getClips);
router.post("/", protect, createClip);

export default router;
