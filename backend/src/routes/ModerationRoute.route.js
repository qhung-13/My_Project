import express from "express";
import {
  timeoutUser,
  banUser,
  unbanUser,
} from "../controllers/ModerationController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.post("/timeout", protect, timeoutUser);
router.post("/ban", protect, banUser);
router.post("/unban", protect, unbanUser);

export default router;
