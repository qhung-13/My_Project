import asyncHandler from "../middlewares/AsyncHandler.middleware.js";
import Notification from "../models/Notification.model.js";

// ─────────────────────────────────────────────
// @desc    Get notifications của user
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .populate("fromUserId", "username displayName avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res.status(200).json({ notifications, unreadCount });
});

// ─────────────────────────────────────────────
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ─────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true },
  );
  res.status(200).json({ message: "All notifications marked as read" });
});

// ─────────────────────────────────────────────
// @desc    Mark 1 notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.status(200).json({ message: "Notification marked as read" });
});

// ─────────────────────────────────────────────
// Helper: Tạo notification (dùng nội bộ trong các controller khác)
// ─────────────────────────────────────────────
export const createNotification = async ({
  userId,
  fromUserId,
  type,
  message,
  link,
}) => {
  try {
    await Notification.create({ userId, fromUserId, type, message, link });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

const createScheduleAnnouncement = asyncHandler(async (req, res) => {
  const userId = String(req.body.userId || "").trim();
  const proposedTime = new Date(req.body.proposedTime);
  const message = String(req.body.message || "")
    .trim()
    .slice(0, 300);

  if (!userId || Number.isNaN(proposedTime.getTime()) || !message) {
    res.status(400);
    throw new Error("User, proposed time, and message are required");
  }
  if (
    !req.isAgent &&
    req.user?._id.toString() !== userId &&
    req.user?.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to create this announcement");
  }

  const User = (await import("../models/User.model.js")).default;
  const user = await User.findById(userId).select("followers username");
  if (!user) {
    res.status(404);
    throw new Error("Streamer not found");
  }

  const documents = (user.followers || []).map((followerId) => ({
    userId: followerId,
    fromUserId: user._id,
    type: "stream_live",
    message,
    link: `/channel/${user._id}`,
  }));
  if (documents.length > 0)
    await Notification.insertMany(documents, { ordered: false });

  res.status(201).json({
    success: true,
    recipients: documents.length,
    proposedTime: proposedTime.toISOString(),
  });
});

export {
  getNotifications,
  markAllAsRead,
  markAsRead,
  createScheduleAnnouncement,
};
