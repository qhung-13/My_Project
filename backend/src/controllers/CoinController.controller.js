import Stripe from "stripe";
import mongoose from "mongoose";
import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import User from "../models/User.model.js";
import TopUp from "../models/TopUp.model.js";
import Donation from "../models/Donation.model.js";
import Stream from "../models/Stream.model.js";
import { createNotification } from "./NotificationController.controller.js";

const COIN_PACKAGES = Object.freeze([
  { id: 1, coins: 100, price: 1, bonus: 0, label: "Starter" },
  { id: 2, coins: 500, price: 5, bonus: 50, label: "Basic" },
  { id: 3, coins: 1000, price: 10, bonus: 150, label: "Popular" },
  { id: 4, coins: 2000, price: 20, bonus: 400, label: "Pro" },
  { id: 5, coins: 5000, price: 50, bonus: 1500, label: "Elite" },
]);

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured");
    error.statusCode = 503;
    throw error;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const paymentMatchesTopUp = (paymentIntent, topUp) =>
  paymentIntent.status === "succeeded" &&
  paymentIntent.currency === "usd" &&
  paymentIntent.amount === Math.round(topUp.amount * 100) &&
  paymentIntent.metadata.userId === topUp.userId.toString() &&
  paymentIntent.metadata.coins === topUp.coins.toString();

const completeTopUp = async (topUp) => {
  const session = await mongoose.startSession();
  let user;

  try {
    await session.withTransaction(async () => {
      const claimed = await TopUp.findOneAndUpdate(
        { _id: topUp._id, status: "pending" },
        { $set: { status: "completed" } },
        { new: true, session },
      );

      if (!claimed) {
        user = await User.findById(topUp.userId)
          .select("coins")
          .session(session);
        return;
      }

      user = await User.findByIdAndUpdate(
        topUp.userId,
        { $inc: { coins: topUp.coins } },
        { new: true, runValidators: true, session },
      ).select("coins");

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
    });

    return user;
  } finally {
    await session.endSession();
  }
};

const getCoinPackages = asyncHandler(async (req, res) => {
  res.status(200).json(COIN_PACKAGES);
});

const createTopUp = asyncHandler(async (req, res) => {
  const packageId = Number(req.body.packageId);
  const selectedPackage = COIN_PACKAGES.find((item) => item.id === packageId);
  if (!selectedPackage) {
    res.status(400);
    throw new Error("Invalid coin package");
  }

  const totalCoins = selectedPackage.coins + selectedPackage.bonus;
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(selectedPackage.price * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      userId: req.user._id.toString(),
      coins: totalCoins.toString(),
      packageId: packageId.toString(),
    },
  });

  try {
    await TopUp.create({
      userId: req.user._id,
      amount: selectedPackage.price,
      coins: totalCoins,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
    });
  } catch (error) {
    await stripe.paymentIntents
      .cancel(paymentIntent.id)
      .catch((cancelError) => {
        console.error(
          "Failed to cancel orphaned payment intent:",
          cancelError.message,
        );
      });
    throw error;
  }

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    coins: totalCoins,
    price: selectedPackage.price,
  });
});

const confirmTopUp = asyncHandler(async (req, res) => {
  const paymentIntentId = String(req.body.paymentIntentId || "").trim();
  if (!paymentIntentId) {
    res.status(400);
    throw new Error("Payment intent id is required");
  }

  const topUp = await TopUp.findOne({
    stripePaymentIntentId: paymentIntentId,
    userId: req.user._id,
  });
  if (!topUp) {
    res.status(404);
    throw new Error("Top up not found");
  }

  const paymentIntent =
    await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.metadata.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Payment does not belong to this account");
  }
  if (!paymentMatchesTopUp(paymentIntent, topUp)) {
    res.status(409);
    throw new Error("Payment details do not match this top up");
  }

  const user = await completeTopUp(topUp);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({ message: "Top up successful", coins: user.coins });
});

const getCoinBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("coins");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({ coins: user.coins ?? 0 });
});

const donateCoins = asyncHandler(async (req, res) => {
  const toUserId = String(req.body.toUserId || "").trim();
  const coins = Number(req.body.coins);
  const message = String(req.body.message || "")
    .trim()
    .slice(0, 200);
  const fromUserId = req.user._id;
  const idempotencyKey = String(req.get("x-idempotency-key") || "").trim();

  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) {
    res.status(400);
    throw new Error("A valid idempotency key is required");
  }

  if (!mongoose.isValidObjectId(toUserId)) {
    res.status(400);
    throw new Error("Invalid streamer id");
  }
  if (!Number.isSafeInteger(coins) || coins < 1 || coins > 1_000_000) {
    res.status(400);
    throw new Error("Invalid donation amount");
  }
  if (fromUserId.toString() === toUserId) {
    res.status(400);
    throw new Error("Cannot donate to yourself");
  }

  const existingDonation = await Donation.findOne({
    fromUserId,
    idempotencyKey,
  });
  if (existingDonation) {
    if (
      existingDonation.toUserId.toString() !== toUserId ||
      existingDonation.coins !== coins ||
      existingDonation.message !== message
    ) {
      res.status(409);
      throw new Error("Idempotency key was already used for another donation");
    }

    const currentSender = await User.findById(fromUserId).select("coins");
    return res.status(200).json({
      message: "Donation already completed",
      coins: currentSender?.coins ?? 0,
      idempotent: true,
    });
  }

  const session = await mongoose.startSession();
  let donation;
  let sender;
  let receiver;

  try {
    await session.withTransaction(async () => {
      receiver = await User.findOne({ _id: toUserId, isActive: true })
        .select("username displayName")
        .session(session);
      if (!receiver) {
        const error = new Error("Streamer not found");
        error.statusCode = 404;
        throw error;
      }

      sender = await User.findOneAndUpdate(
        { _id: fromUserId, coins: { $gte: coins }, isActive: true },
        { $inc: { coins: -coins } },
        { new: true, runValidators: true, session },
      ).select("username displayName avatar coins");
      if (!sender) {
        const error = new Error("Insufficient coins");
        error.statusCode = 400;
        throw error;
      }

      await User.findByIdAndUpdate(
        toUserId,
        { $inc: { coins } },
        { runValidators: true, session },
      );

      [donation] = await Donation.create(
        [
          {
            fromUserId,
            toUserId,
            coins,
            message,
            status: "completed",
            idempotencyKey,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await Donation.findOne({ fromUserId, idempotencyKey });
      if (duplicate) {
        if (
          duplicate.toUserId.toString() !== toUserId ||
          duplicate.coins !== coins ||
          duplicate.message !== message
        ) {
          res.status(409);
          throw new Error(
            "Idempotency key was already used for another donation",
          );
        }

        const currentSender = await User.findById(fromUserId).select("coins");
        return res.status(200).json({
          message: "Donation already completed",
          coins: currentSender?.coins ?? 0,
          idempotent: true,
        });
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }

  // Realtime/UI side effects happen only after the database transaction has
  // committed. Their failure must not roll back or misreport a completed
  // transfer to the client.
  try {
    await createNotification({
      userId: toUserId,
      fromUserId,
      type: "donate",
      message: `${sender.displayName || sender.username} đã donate ${coins} xu cho bạn`,
      link: `/profile/${fromUserId}`,
    });
  } catch (error) {
    console.error("Failed to create donation notification:", error.message);
  }

  try {
    const liveStream = await Stream.findOne({
      userId: toUserId,
      isLive: true,
    }).select("_id");
    if (liveStream) {
      req.app
        .get("io")
        ?.to(`stream:${liveStream._id}`)
        .emit("donation-received", {
          id: donation._id.toString(),
          fromUsername: sender.displayName || sender.username,
          fromAvatar: sender.avatar,
          coins,
          message,
          timestamp:
            donation.createdAt?.toISOString?.() || new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Failed to broadcast donation:", error.message);
  }

  res.status(200).json({
    message: "Donation successful",
    coins: sender.coins,
    receiver: receiver.displayName || receiver.username,
    idempotent: false,
  });
});

const getDonationHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [sent, received] = await Promise.all([
    Donation.find({ fromUserId: userId })
      .populate("toUserId", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(20),
    Donation.find({ toUserId: userId })
      .populate("fromUserId", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(20),
  ]);
  res.status(200).json({ sent, received });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send("Missing webhook signature or secret");
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const topUp = await TopUp.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    if (topUp && paymentMatchesTopUp(paymentIntent, topUp)) {
      await completeTopUp(topUp);
    } else if (topUp) {
      console.error(
        `Rejected mismatched Stripe payment intent ${paymentIntent.id}`,
      );
      await TopUp.updateOne(
        { _id: topUp._id, status: "pending" },
        { $set: { status: "failed" } },
      );
    }
  } else if (event.type === "payment_intent.payment_failed") {
    await TopUp.findOneAndUpdate(
      { stripePaymentIntentId: event.data.object.id, status: "pending" },
      { status: "failed" },
    );
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
