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
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
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

export { getNotifications, markAllAsRead, markAsRead };
