import { MessageSquare, Play, MoreHorizontal, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { formatViewers } from "../../utils/format";
import "./WatchLive.css";
import { useNavigate, useParams } from "react-router-dom";
import { STREAMS } from "../../data/stream";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserByIdQuery,
} from "../../store/api/userApi";

// ============================================================
// Mock chat data
// ============================================================
const MESSAGES = [
  {
    id: 1,
    user: "NhokKute",
    color: "#E24B4A",
    initials: "NK",
    text: "gg ez win 🔥",
  },
  {
    id: 2,
    user: "GalaxyX",
    color: "#534AB7",
    initials: "GX",
    text: "pro gameplay! 🎮",
  },
  {
    id: 3,
    user: "CSProVN",
    color: "#0F6E56",
    initials: "CS",
    text: "go go tiger!!",
  },
  {
    id: 4,
    user: "ProBattle",
    color: "#854F0B",
    initials: "PB",
    text: "đỉnh quá bro 👏",
  },
  {
    id: 5,
    user: "MixGaming",
    color: "#993556",
    initials: "MX",
    text: "carry team ez 💪",
  },
  {
    id: 6,
    user: "TigerGaming",
    color: "#1877F2",
    initials: "TG",
    text: "cảm ơn mọi người 🙏",
  },
  {
    id: 7,
    user: "NhokKute",
    color: "#E24B4A",
    initials: "NK",
    text: "gg ez win 🔥",
  },
  {
    id: 8,
    user: "GalaxyX",
    color: "#534AB7",
    initials: "GX",
    text: "pro gameplay! 🎮",
  },
  {
    id: 9,
    user: "CSProVN",
    color: "#0F6E56",
    initials: "CS",
    text: "go go tiger!!",
  },
  {
    id: 10,
    user: "ProBattle",
    color: "#854F0B",
    initials: "PB",
    text: "đỉnh quá bro 👏",
  },
];

// ============================================================
// Component
// ============================================================
const WatchLive = () => {
  const { streamerId: id } = useParams<{ streamerId: string }>();
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [prevId, setPrevId] = useState(id);

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const currentStream = STREAMS.find((s) => s.id === id) || STREAMS[0];

  // Reset chat when stream changes
  if (id !== prevId) {
    setPrevId(id);
    setIsChatOpen(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch streamer data to check follow status
  const { data: streamerData } = useGetUserByIdQuery(currentStream.userId, {
    skip: !currentStream.userId,
  });

  const isFollowing =
    streamerData?.followers?.some(
      (followerId: string) => followerId.toString() === authUser?._id,
    ) ?? false;

  const handleFollow = async () => {
    if (!currentStream.userId) return;
    try {
      if (isFollowing) {
        await unfollowUser(currentStream.userId).unwrap();
      } else {
        await followUser(currentStream.userId).unwrap();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const suggestedStreams = STREAMS.filter(
    (stream) => stream.id !== currentStream.id,
  ).slice(0, 10);

  return (
    <div className="watch-live">
      {/* ── Video ── */}
      <div className="watch-live__video">
        <div className="video-badges">
          <span className="badge-live">LIVE</span>
          <span className="badge-viewers">
            {formatViewers(currentStream.viewers)}
          </span>
        </div>
        <div className="video-play-btn">
          <Play size={36} fill="white" />
        </div>
      </div>

      {/* ── Streamer info ── */}
      <div className="watch-live__info">
        <div className="info-header">
          <div
            className="info-avatar"
            style={{ background: currentStream.avatarColor }}
            onClick={() => {
              if (currentStream.userId) {
                navigate(`/profile/${currentStream.userId}`);
              }
            }}
          >
            {currentStream.initials}
          </div>
          <div className="info-details">
            <h2 className="info-title">{currentStream.streamTitle}</h2>
            <p className="info-meta">
              <span className="live-dot" />
              {currentStream.streamerName} · {currentStream.game}
            </p>
          </div>
        </div>
        <div className="info-actions">
          <button className="btn-follow" onClick={handleFollow}>
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button className="btn-share">Share</button>
          <button className="btn-more">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── Chat + Suggested ── */}
      <div className="watch-live__interactive">
        {/* ── Chat panel ── */}
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
              {MESSAGES.map((msg) => (
                <div className="chat-msg" key={msg.id}>
                  <div
                    className="chat-msg__avatar"
                    style={{ background: msg.color }}
                  >
                    {msg.initials}
                  </div>
                  <div>
                    <span
                      className="chat-msg__user"
                      style={{ color: msg.color }}
                    >
                      {msg.user}{" "}
                    </span>
                    <span className="chat-msg__text">{msg.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-panel__input">
              <input
                type="text"
                placeholder="Hãy nói điều gì đó..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="chat-panel__send">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Stream Gợi Ý ── */}
        <div
          className={`suggested ${isChatOpen ? "suggested--hidden-mobile" : ""}`}
        >
          <h3 className="suggested__title">Stream khác</h3>
          <div className="suggested__list">
            {suggestedStreams.map((stream) => (
              <div
                className="suggested-card"
                key={stream.id}
                onClick={() => navigate(`/stream/${stream.id}`)}
              >
                <div
                  className="suggested-card__thumb"
                  style={{ background: stream.bg }}
                >
                  <span className="suggested-card__badge">LIVE</span>
                  <span className="suggested-card__viewers">
                    {formatViewers(stream.viewers)}
                  </span>
                  <Play size={12} fill="rgba(255,255,255,0.4)" />
                </div>
                <div className="suggested-card__info">
                  <div className="suggested-card__title">
                    {stream.streamTitle}
                  </div>
                  <div className="suggested-card__streamer">
                    <div
                      className="suggested-card__avatar"
                      style={{ background: stream.avatarColor }}
                    >
                      {stream.initials}
                    </div>
                    <span>{stream.streamerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchLive;
