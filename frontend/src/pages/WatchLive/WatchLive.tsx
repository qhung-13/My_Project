import { MessageSquare, Play, MoreHorizontal, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatViewers } from "../../utils/format";
import "./WatchLive.css";
import { useNavigate, useParams } from "react-router-dom";
import { STREAMS } from "../../data/stream";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type {ChatMessage} from "../../types/index"
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserByIdQuery,
} from "../../store/api/userApi";
import socket from "../../utils/socket";
import Hls from "hls.js";

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
  const videoRef = useRef<HTMLVideoElement>(null);

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const currentStream = STREAMS.find((s) => s.id === id) || STREAMS[0];

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
    const streamId = currentStream.id;
    socket.connect();
    socket.emit("join-stream", streamId);

    socket.on("chat-message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("viewer-count", (count: number) => {
      setViewerCount(count);
    });

    return () => {
      socket.emit("leave-stream", streamId);
      socket.off("chat-message");
      socket.off("viewer-count");
      socket.disconnect();
    };
  }, [currentStream.id]);

  useEffect(() => {
    const streamKey = currentStream.id;
    const hlsUrl = `http://localhost:8000/live/${streamKey}/index.m3u8`;

    if(Hls.isSupport()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current)

      return () => {
        hls.destroy()
      }
    } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = hlsUrl;
    }
  }, [currentStream.id]);

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
      if (isFollowing) await unfollowUser(currentStream.userId).unwrap();
      else await followUser(currentStream.userId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    socket.emit("chat-message", {
      streamId: currentStream.id,
      message: inputMessage.trim(),
      user: authUser?.username || "Anonymous",
    });
    setInputMessage("");
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
          <span className="badge-viewers">{formatViewers(viewerCount)}</span>
        </div>
         <video
    ref={videoRef}
    controls
    autoPlay
    muted
    style={{ width: "100%", height: "100%", objectFit: "contain" }}
  />
      </div>

      {/* ── Streamer info ── */}
      <div className="watch-live__info">
        <div className="info-header">
          <div
            className="info-avatar"
            style={{ background: currentStream.avatarColor }}
            onClick={() => {
              if (currentStream.userId)
                navigate(`/profile/${currentStream.userId}`);
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
                    style={{ background: "#6366f1" }}
                  >
                    {msg.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="chat-msg__user">{msg.user} </span>
                    <span className="chat-msg__text">{msg.message}</span>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <div className="chat-panel__input">
              <input
                type="text"
                placeholder="Hãy nói điều gì đó..."
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} 
              />
              <button className="chat-panel__send" onClick={handleSendMessage}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

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
