import express from "express";
import {
  timeoutUser,
  banUser,
  unbanUser,
} from "../controllers/ModerationController.controller.js";
import { protectOrAgent } from "../middlewares/Auth.middleware.js";

const router = express.Router();
router.use(protectOrAgent);
router.post("/timeout", timeoutUser);
router.post("/ban", banUser);
router.post("/unban", unbanUser);
export default router;
