import express from "express";
import {
  getCoinPackages,
  createTopUp,
  confirmTopUp,
  getCoinBalance,
  donateCoins,
  getDonationHistory,
  handleWebhook,
} from "../controllers/CoinController.controller.js";
import protect from "../middlewares/Auth.middleware.js";
import { donateLimiter } from "../middlewares/RateLimiting.middleware.js";

const router = express.Router();

router.post("/webhook", handleWebhook);

router.get("/packages", getCoinPackages);
router.get("/balance", protect, getCoinBalance);
router.post("/topup", protect, createTopUp);
router.post("/topup/confirm", protect, confirmTopUp);
router.post("/donate", protect, donateLimiter, donateCoins);
router.get("/donations", protect, getDonationHistory);

export default router;
