import { MessageSquare, Play, MoreHorizontal, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatViewers, generateColor } from "../../utils/format";
import "./WatchLive.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { ChatMessage, DonationAlert, Stream } from "../../types/index";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserByIdQuery,
} from "../../store/api/userApi";
import {
  useGetStreamByIdQuery,
  useGetLiveStreamsQuery,
  useBanUserMutation,
  useTimeoutUserMutation,
} from "../../store/api/streamApi";
import socket from "../../utils/socket";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import DonateModal from "./DonateModal/DonateModal";

// ============================================================
// Component
// ============================================================
const WatchLive = () => {
  const { streamerId: id } = useParams<{ streamerId: string }>();
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [prevId, setPrevId] = useState(id);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donationAlerts, setDonationAlerts] = useState<DonationAlert[]>([]);

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const [timeoutUser] = useTimeoutUserMutation();
  const [banUser] = useBanUserMutation();
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  const { data: currentStream, isLoading: isStreamLoading } =
    useGetStreamByIdQuery(id!, { skip: !id }) as {
      data: Stream | undefined;
      isLoading: boolean;
    };

  const { data: result } = useGetLiveStreamsQuery(undefined);

  if (id !== prevId) {
    setPrevId(id);
    setIsChatOpen(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    messageEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!id) return;
    socket.connect();
    socket.emit("join-stream", id);

    socket.on("chat-message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("viewer-count", (count: number) => {
      setViewerCount(count);
    });

    socket.on("donation-received", (data: DonationAlert) => {
      setDonationAlerts((prev) => [...prev, data]);
      setTimeout(() => {
        setDonationAlerts((prev) => prev.filter((_, i) => i !== 0));
      }, 5000);
    });

    return () => {
      socket.emit("leave-stream", id);
      socket.off("chat-message");
      socket.off("viewer-count");
      socket.off("donation-received");
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    socket.on("chat-blocked", ({ message }: { message: string }) => {
      setIsBlocked(true);
      setBlockMessage(message);
    });

    socket.on(
      "user-moderated",
      ({
        userId,
        action,
        message,
      }: {
        userId: string;
        action: string;
        message: string;
      }) => {
        if (userId === authUser?._id) {
          setIsBlocked(action === "ban");
          setBlockMessage(message);
        }
      },
    );

    return () => {
      socket.off("chat-blocked");
      socket.off("user-moderated");
    };
  }, [authUser?._id]);

  const handleTimeout = async (seconds: number) => {
    if (!selectedUser || !id) return;
    await timeoutUser({
      userId: selectedUser.id,
      streamId: id,
      durationSeconds: seconds,
    }).unwrap();
    setSelectedUser(null);
  };

  const handleBan = async () => {
    if (!selectedUser || !id) return;
    await banUser({
      userId: selectedUser.id,
      streamId: id,
      reason: "Vi phạm nội quy",
    }).unwrap();
    setSelectedUser(null);
  };

  const streamerId =
    typeof currentStream?.userId === "object"
      ? currentStream.userId._id
      : currentStream?.userId;

  const { data: streamerData } = useGetUserByIdQuery(streamerId!, {
    skip: !streamerId,
  });

  const isFollowing =
    streamerData?.followers?.some(
      (followerId: string) => followerId.toString() === authUser?._id,
    ) ?? false;

  const handleFollow = async () => {
    if (!streamerId) return;
    try {
      if (isFollowing) await unfollowUser(streamerId).unwrap();
      else await followUser(streamerId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !id) return;
    socket.emit("chat-message", {
      streamId: id,
      message: inputMessage.trim(),
      user: authUser?.username || "Anonymous",
      userId: authUser?._id || null, // ✅ Thêm userId
    });
    setInputMessage("");
  };

  const suggestedStreams = (result?.streams || [])
    .filter((stream: Stream) => stream._id !== id)
    .slice(0, 10);

  if (isStreamLoading) {
    return <div className="watch-live__loading">Loading...</div>;
  }

  if (!currentStream) {
    return (
      <div className="watch-live__loading">
        Stream không tồn tại hoặc đã kết thúc
      </div>
    );
  }

  const streamerName =
    typeof currentStream.userId === "object"
      ? currentStream.userId.displayName || currentStream.userId.username
      : "Unknown";

  const streamerAvatar =
    typeof currentStream.userId === "object"
      ? currentStream.userId.avatar
      : null;

  return (
    <div className="watch-live">
      {/* ── Video ── */}
      <div className="watch-live__video">
        <div className="video-badges">
          <span className="badge-live">LIVE</span>
          <span className="badge-viewers">{formatViewers(viewerCount)}</span>
        </div>
        <VideoPlayer streamKey={currentStream.streamKey || ""} />
      </div>

      {/* ── Streamer info ── */}
      <div className="watch-live__info">
        <div className="info-header">
          <div
            className="info-avatar"
            style={{ background: generateColor(streamerName) }}
            onClick={() => {
              if (streamerId) navigate(`/profile/${streamerId}`);
            }}
          >
            {streamerAvatar ? (
              <img
                src={streamerAvatar}
                alt={streamerName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              streamerName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="info-details">
            <h2 className="info-title">{currentStream.title}</h2>
            <p className="info-meta">
              <span className="live-dot" />
              {streamerName} · {currentStream.category}
            </p>
          </div>
        </div>
        <div className="info-actions">
          {streamerId !== authUser?._id && (
            <button className="btn-follow" onClick={handleFollow}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {streamerId !== authUser?._id && (
            <button
              className="btn-donate"
              onClick={() => setIsDonateModalOpen(true)}
            >
              Donate
            </button>
          )}
          <button className="btn-share">Share</button>
          <button className="btn-more">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── Chat + Suggested ── */}
      <div className="watch-live__interactive">
        <div className={`chat-panel ${isChatOpen ? "chat-panel--open" : ""}`}>
          <div
            className="chat-panel__tab"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <div className="chat-panel__tab-left">
              <MessageSquare size={14} />
              <span>Trò chuyện trực tiếp</span>
              {!isChatOpen && (
                <span className="chat-panel__hint">· Hãy nói điều gì đó!</span>
              )}
            </div>
            <span
              className={`chat-panel__arrow ${isChatOpen ? "chat-panel__arrow--up" : ""}`}
            >
              ↑
            </span>
          </div>

          <div className="chat-panel__content">
            <div className="chat-panel__messages">
              {messages.map((msg) => (
                <div className="chat-msg" key={msg.id}>
                  <div
                    className="chat-msg__avatar"
                    style={{ background: generateColor(msg.user) }}
                  >
                    {msg.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span
                      className="chat-msg__user"
                      style={{
                        cursor:
                          streamerId === authUser?._id ? "pointer" : "default",
                      }}
                      onClick={() => {
                        // Chỉ streamer mới thấy moderation menu
                        if (
                          streamerId === authUser?._id &&
                          msg.userId !== authUser?._id
                        ) {
                          setSelectedUser({ id: msg.userId, name: msg.user });
                        }
                      }}
                    >
                      {msg.user}{" "}
                    </span>
                    <span className="chat-msg__text">{msg.message}</span>
                  </div>
                </div>
              ))}

              {/* Moderation menu */}
              {selectedUser && streamerId === authUser?._id && (
                <div className="moderation-menu">
                  <div className="moderation-menu__header">
                    <span>⚙️ {selectedUser.name}</span>
                    <button onClick={() => setSelectedUser(null)}>✕</button>
                  </div>
                  <button onClick={() => handleTimeout(60)}>
                    ⏱ Timeout 1 phút
                  </button>
                  <button onClick={() => handleTimeout(300)}>
                    ⏱ Timeout 5 phút
                  </button>
                  <button onClick={handleBan} className="moderation-menu__ban">
                    🚫 Ban
                  </button>
                </div>
              )}

              {/* Blocked message */}
              {isBlocked && (
                <div className="chat-blocked">🚫 {blockMessage}</div>
              )}

              {/* Input — ẩn nếu bị block */}
              {!isBlocked && (
                <div className="chat-panel__input">
                  <input
                    type="text"
                    placeholder="Hãy nói điều gì đó..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    className="chat-panel__send"
                    onClick={handleSendMessage}
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
          </div>
        </div>

        <div
          className={`suggested ${isChatOpen ? "suggested--hidden-mobile" : ""}`}
        >
          <h3 className="suggested__title">Stream khác</h3>
          <div className="suggested__list">
            {suggestedStreams.map((stream: Stream) => {
              const name =
                typeof stream.userId === "object"
                  ? stream.userId.displayName || stream.userId.username
                  : "Unknown";
              return (
                <div
                  className="suggested-card"
                  key={stream._id}
                  onClick={() => navigate(`/stream/${stream._id}`)}
                >
                  <div
                    className="suggested-card__thumb"
                    style={{ background: "#0a1a2e" }}
                  >
                    <span className="suggested-card__badge">LIVE</span>
                    <span className="suggested-card__viewers">
                      {formatViewers(stream.viewers)}
                    </span>
                    <Play size={12} fill="rgba(255,255,255,0.4)" />
                  </div>
                  <div className="suggested-card__info">
                    <div className="suggested-card__title">{stream.title}</div>
                    <div className="suggested-card__streamer">
                      <div
                        className="suggested-card__avatar"
                        style={{ background: generateColor(name) }}
                      >
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="donation-alerts">
        {donationAlerts.map((alert, index) => (
          <div className="donation-alert" key={index}>
            <div className="donation-alert__avatar">
              {alert.fromAvatar ? (
                <img src={alert.fromAvatar} alt={alert.fromUsername} />
              ) : (
                alert.fromUsername.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="donation-alert__content">
              <span className="donation-alert__username">
                {alert.fromUsername}
              </span>
              <span className="donation-alert__coins">{alert.coins} xu</span>
              {alert.message && (
                <p className="donation-alert__message">{alert.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isDonateModalOpen && streamerId && (
        <DonateModal
          streamerId={streamerId}
          streamerName={streamerName}
          onClose={() => setIsDonateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default WatchLive;
