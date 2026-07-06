import { useState } from "react";
import { Bell } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../../store/api/notificationApi";
import { useNavigate } from "react-router-dom";
import "./Notification.css";

interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  fromUserId?: {
    _id: string;
    username: string;
    avatar?: string | null;
  };
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000, // Tự động refetch mỗi 30 giây
  });
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification._id).unwrap();
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllAsRead(undefined).unwrap();
  };

  const getIcon = (type: string) => {
    if (type === "follow") return "👤";
    if (type === "donate") return "💝";
    if (type === "stream_live") return "🔴";
    if (type === "video_upload") return "📹";
    return "🔔";
  };

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-bell__overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-bell__dropdown">
            <div className="notification-bell__header">
              <h3>Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  className="notification-bell__read-all"
                  onClick={handleMarkAll}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="notification-bell__list">
              {notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <span>🔔</span>
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                notifications.map((notif: NotificationItem) => (
                  <div
                    key={notif._id}
                    className={`notification-item ${!notif.isRead ? "notification-item--unread" : ""}`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className="notification-item__icon">
                      {notif.fromUserId?.avatar ? (
                        <img
                          src={notif.fromUserId.avatar}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span>{getIcon(notif.type)}</span>
                      )}
                    </div>
                    <div className="notification-item__content">
                      <p className="notification-item__message">
                        {notif.message}
                      </p>
                      <span className="notification-item__time">
                        {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <div className="notification-item__dot" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
