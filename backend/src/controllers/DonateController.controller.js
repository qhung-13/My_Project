import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import Donation from "../models/Donation.model.js";
import Stripe from "stripe";

const createPayment = asyncHandler(async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const { fromUserId, toUserId, amount, message } = req.body;

  if (!fromUserId || !toUserId || !amount) {
    res.status(400);
    throw new Error("Missing required fields for donation.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "usd",
    metadata: { fromUserId, toUserId },
  });

  const newDonation = new Donation({
    fromUserId,
    toUserId,
    amount,
    message,
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });

  await newDonation.save();

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    fromUserId: newDonation.fromUserId,
    toUserId: newDonation.toUserId,
    amount: newDonation.amount,
    message: newDonation.message,
    stripePaymentIntentId: newDonation.stripePaymentIntentId,
    status: newDonation.status,
  });
});

export { createPayment };
