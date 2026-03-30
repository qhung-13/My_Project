import { MessageSquare, Play, MoreHorizontal, Send } from "lucide-react";
import { useState } from "react";
import { formatViewers } from "../../utils/format";
import "./WatchLive.css";
import { useNavigate } from "react-router-dom";
import { STREAMS } from "../../data/stream";

// ============================================================
// Mock data
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
  {
    id: 11,
    user: "MixGaming",
    color: "#993556",
    initials: "MX",
    text: "carry team ez 💪",
  },
  {
    id: 12,
    user: "TigerGaming",
    color: "#1877F2",
    initials: "TG",
    text: "cảm ơn mọi người 🙏",
  },
  {
    id: 13,
    user: "NhokKute",
    color: "#E24B4A",
    initials: "NK",
    text: "gg ez win 🔥",
  },
  {
    id: 14,
    user: "GalaxyX",
    color: "#534AB7",
    initials: "GX",
    text: "pro gameplay! 🎮",
  },
  {
    id: 15,
    user: "CSProVN",
    color: "#0F6E56",
    initials: "CS",
    text: "go go tiger!!",
  },
  {
    id: 16,
    user: "ProBattle",
    color: "#854F0B",
    initials: "PB",
    text: "đỉnh quá bro 👏",
  },
  {
    id: 17,
    user: "MixGaming",
    color: "#993556",
    initials: "MX",
    text: "carry team ez 💪",
  },
  {
    id: 18,
    user: "TigerGaming",
    color: "#1877F2",
    initials: "TG",
    text: "cảm ơn mọi người 🙏",
  },
];

const SUGGESTED = STREAMS;

// ============================================================
// Component
// ============================================================
const WatchLive = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate()

  return (
    <div className="watch-live">
      {/* ── Video ── */}
      <div className="watch-live__video">
        <div className="video-badges">
          <span className="badge-live">LIVE</span>
          <span className="badge-viewers">8.1k đang xem</span>
        </div>
        <div className="video-play-btn">
          <Play size={36} fill="white" />
        </div>
      </div>

      {/* ── Streamer info ── */}
      <div className="watch-live__info">
        <div className="info-header">
          <div className="info-avatar">TG</div>
          <div className="info-details">
            <h2 className="info-title">
              Rank Challenger LOL — Đường đến Thách Đấu
            </h2>
            <p className="info-meta">
              <span className="live-dot" />
              TigerGaming · League of Legends
            </p>
          </div>
        </div>
        <div className="info-actions">
          <button className="btn-follow">+ Follow</button>
          <button className="btn-share">Share</button>
          <button className="btn-more">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── Chat + Suggested ── */}
      <div className="watch-live__interactive">
        {/* ── Chat panel — bottom sheet ── */}
        <div className={`chat-panel ${isChatOpen ? "chat-panel--open" : ""}`}>
          {/* Tab bar — LUÔN HIỆN */}
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

          {/* Messages — chỉ hiện khi open */}
          {isChatOpen && (
            <>
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
                  autoFocus
                />
                <button className="chat-panel__send">
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
        {!isChatOpen && (
          <div className="suggested">
            <h3 className="suggested__title">Stream khác</h3>
            <div className="suggested__list">
              {SUGGESTED.map((stream) => (
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
        )}
      </div>
    </div>
  );
};

export default WatchLive;
