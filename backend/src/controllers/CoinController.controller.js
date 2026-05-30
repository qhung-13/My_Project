import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import User from "../models/User.model.js";
import TopUp from "../models/TopUp.model.js";
import Donation from "../models/Donation.model.js";
import Stripe from "stripe";

const COIN_RATE = 100;

// ─────────────────────────────────────────────
// @desc    Get coin packages
// @route   GET /api/coins/packages
// @access  Public
// ─────────────────────────────────────────────
const getCoinPackages = asyncHandler(async (req, res) => {
  const packages = [
    { id: 1, coins: 100, price: 1, bonus: 0, label: "Starter" },
    { id: 2, coins: 500, price: 5, bonus: 50, label: "Basic" },
    { id: 3, coins: 1000, price: 10, bonus: 150, label: "Popular" },
    { id: 4, coins: 2000, price: 20, bonus: 400, label: "Pro" },
    { id: 5, coins: 5000, price: 50, bonus: 1500, label: "Elite" },
  ];
  res.status(200).json(packages);
});

// ─────────────────────────────────────────────
// @desc    Create payment intent for top up
// @route   POST /api/coins/topup
// @access  Private
// ─────────────────────────────────────────────
const createTopUp = asyncHandler(async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { packageId } = req.body;
  const userId = req.user._id;

  const packages = [
    { id: 1, coins: 100, price: 1, bonus: 0 },
    { id: 2, coins: 500, price: 5, bonus: 50 },
    { id: 3, coins: 1000, price: 10, bonus: 150 },
    { id: 4, coins: 2000, price: 20, bonus: 400 },
    { id: 5, coins: 5000, price: 50, bonus: 1500 },
  ];

  const selectedPackage = packages.find((p) => p.id === packageId);
  if (!selectedPackage) {
    res.status(400);
    throw new Error("Invalid package");
  }

  const totalCoins = selectedPackage.coins + selectedPackage.bonus;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: selectedPackage.price * 100, // cents
    currency: "usd",
    metadata: { userId: userId.toString(), coins: totalCoins.toString() },
  });

  const topUp = new TopUp({
    userId,
    amount: selectedPackage.price,
    coins: totalCoins,
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });

  await topUp.save();

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    coins: totalCoins,
    price: selectedPackage.price,
  });
});

// ─────────────────────────────────────────────
// @desc    Confirm top up after payment success
// @route   POST /api/coins/topup/confirm
// @access  Private
// ─────────────────────────────────────────────
const confirmTopUp = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.user._id;

  const topUp = await TopUp.findOne({
    stripePaymentIntentId: paymentIntentId,
    userId,
  });

  if (!topUp) {
    res.status(404);
    throw new Error("TopUp not found");
  }

  if (topUp.status === "completed") {
    res.status(400);
    throw new Error("TopUp already confirmed");
  }

  // Update topup status
  topUp.status = "completed";
  await topUp.save();

  // Add coins to user
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { coins: topUp.coins } },
    { new: true },
  );

  res.status(200).json({
    message: "Top up successful",
    coins: user.coins,
  });
});

// ─────────────────────────────────────────────
// @desc    Get user coin balance
// @route   GET /api/coins/balance
// @access  Private
// ─────────────────────────────────────────────
const getCoinBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ coins: user.coins });
});

// ─────────────────────────────────────────────
// @desc    Donate coins to streamer
// @route   POST /api/coins/donate
// @access  Private
// ─────────────────────────────────────────────
const donateCoins = asyncHandler(async (req, res) => {
  const { toUserId, coins, message } = req.body;
  const fromUserId = req.user._id;

  if (!toUserId || !coins || coins < 1) {
    res.status(400);
    throw new Error("Invalid donation data");
  }

  if (fromUserId.toString() === toUserId) {
    res.status(400);
    throw new Error("Cannot donate to yourself");
  }

  // Check sender balance
  const sender = await User.findById(fromUserId);
  if (sender.coins < coins) {
    res.status(400);
    throw new Error("Insufficient coins");
  }

  // Check receiver exists
  const receiver = await User.findById(toUserId);
  if (!receiver) {
    res.status(404);
    throw new Error("Streamer not found");
  }

  // Deduct coins from sender
  await User.findByIdAndUpdate(fromUserId, { $inc: { coins: -coins } });

  // Add coins to receiver
  await User.findByIdAndUpdate(toUserId, { $inc: { coins: coins } });

  // Save donation record
  const donation = new Donation({
    fromUserId,
    toUserId,
    coins,
    message: message || "",
    status: "completed",
  });
  await donation.save();

  // TODO: Socket.io notify streamer

  res.status(200).json({
    message: "Donation successful",
    coins: sender.coins - coins,
  });
});

// ─────────────────────────────────────────────
// @desc    Get donation history
// @route   GET /api/coins/donations
// @access  Private
// ─────────────────────────────────────────────
const getDonationHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const sent = await Donation.find({ fromUserId: userId })
    .populate("toUserId", "username displayName avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  const received = await Donation.find({ toUserId: userId })
    .populate("fromUserId", "username displayName avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({ sent, received });
});

// ─────────────────────────────────────────────
// @desc    Handle Stripe webhook
// @route   POST /api/coins/webhook
// @access  Public (Stripe calls this)
// ─────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { userId, coins } = paymentIntent.metadata;

    const topUp = await TopUp.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (topUp && topUp.status !== "completed") {
      topUp.status = "completed";
      await topUp.save();

      await User.findByIdAndUpdate(userId, {
        $inc: { coins: parseInt(coins) },
      });

      console.log(`Webhook: Added ${coins} coins to user ${userId}`);
    }
  }

  res.status(200).json({ received: true });
});

export {
  getCoinPackages,
  createTopUp,
  confirmTopUp,
  getCoinBalance,
  donateCoins,
  getDonationHistory,
  handleWebhook,
};
