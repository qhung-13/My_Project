import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../../store/api/notificationApi";
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

const getIcon = (type: string) => {
  if (type === "follow") return "👤";
  if (type === "donate") return "💝";
  if (type === "stream_live") return "🔴";
  if (type === "video_upload") return "📹";
  return "🔔";
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data, isLoading, isError } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
  });
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const notifications: NotificationItem[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    dropdownRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClick = async (notification: NotificationItem) => {
    setActionError("");
    try {
      if (!notification.isRead) await markAsRead(notification._id).unwrap();
      if (notification.link?.startsWith("/")) navigate(notification.link);
      setIsOpen(false);
    } catch {
      setActionError("Không thể cập nhật thông báo. Vui lòng thử lại.");
    }
  };

  const handleMarkAll = async () => {
    setActionError("");
    try {
      await markAllAsRead(undefined).unwrap();
    } catch {
      setActionError("Không thể đánh dấu tất cả là đã đọc.");
    }
  };

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__btn"
        type="button"
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setActionError("");
          setIsOpen((current) => !current);
        }}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-bell__badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            className="notification-bell__overlay"
            type="button"
            aria-label="Đóng danh sách thông báo"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="notification-bell__dropdown"
            role="dialog"
            aria-label="Thông báo"
            tabIndex={-1}
          >
            <div className="notification-bell__header">
              <h3>Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  className="notification-bell__read-all"
                  type="button"
                  disabled={isMarkingAll}
                  onClick={() => void handleMarkAll()}
                >
                  {isMarkingAll ? "Đang cập nhật…" : "Đánh dấu đã đọc"}
                </button>
              )}
            </div>

            {actionError && (
              <p className="notification-bell__error" role="alert">
                {actionError}
              </p>
            )}

            <div className="notification-bell__list">
              {isLoading ? (
                <p className="notification-bell__empty" role="status">
                  Đang tải thông báo…
                </p>
              ) : isError ? (
                <p className="notification-bell__empty" role="alert">
                  Không thể tải thông báo.
                </p>
              ) : notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <span aria-hidden="true">🔔</span>
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    className={`notification-item ${!notification.isRead ? "notification-item--unread" : ""}`}
                    onClick={() => void handleClick(notification)}
                  >
                    <span
                      className="notification-item__icon"
                      aria-hidden="true"
                    >
                      {notification.fromUserId?.avatar ? (
                        <img src={notification.fromUserId.avatar} alt="" />
                      ) : (
                        <span>{getIcon(notification.type)}</span>
                      )}
                    </span>
                    <span className="notification-item__content">
                      <span className="notification-item__message">
                        {notification.message}
                      </span>
                      <span className="notification-item__time">
                        {new Date(notification.createdAt).toLocaleString(
                          "vi-VN",
                          {
                            dateStyle: "short",
                            timeStyle: "short",
                          },
                        )}
                      </span>
                    </span>
                    {!notification.isRead && (
                      <span
                        className="notification-item__dot"
                        aria-label="Chưa đọc"
                      />
                    )}
                  </button>
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
