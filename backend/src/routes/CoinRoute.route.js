import express from "express";
import {
  getCoinPackages,
  createTopUp,
  confirmTopUp,
  getCoinBalance,
  donateCoins,
  getDonationHistory,
} from "../controllers/CoinController.controller.js";
import protect from "../middlewares/Auth.middleware.js";

const router = express.Router();

router.get("/packages", getCoinPackages);
router.get("/balance", protect, getCoinBalance);
router.post("/topup", protect, createTopUp);
router.post("/topup/confirm", protect, confirmTopUp);
router.post("/donate", protect, donateCoins);
router.get("/donations", protect, getDonationHistory);

export default router;
