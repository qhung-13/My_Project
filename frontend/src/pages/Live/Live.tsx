import { useState } from "react";
import { Play } from "lucide-react";
import { formatViewers, generateColor } from "../../utils/format";
import "./Live.css";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import type { Stream } from "../../types/index";

// ============================================================
// Constants
// ============================================================
const GAMES = ["All", "Valorant", "LOL", "PUBG", "CS2", "Dota 2", "FIFA", "MLBB", "COD"];

// ============================================================
// Component
// ============================================================
const Live = () => {
  const [activeGame, setActiveGame] = useState("All");
  const [sortBy, setSortBy] = useState<"viewers" | "newest">("viewers");
  const navigate = useNavigate();

  const { data: result, isLoading } = useGetLiveStreamsQuery(undefined);

  const filteredStreams = (result?.streams || [])
    .filter((s: Stream) => activeGame === "All" || s.category === activeGame)
    .slice()
    .sort((a: Stream, b: Stream) =>
      sortBy === "viewers"
        ? b.viewers - a.viewers
        : new Date(b.startedAt || b.createdAt).getTime() -
          new Date(a.startedAt || a.createdAt).getTime(),
    );

  if (isLoading) {
    return <div className="live-page__loading">Loading...</div>;
  }

  return (
    <div className="live-page">
      {/* Header */}
      <div className="live-page__header">
        <div className="live-page__title">
          <span className="live-page__dot" />
          Live
          <span className="live-page__count">
            {filteredStreams.length} streams
          </span>
        </div>
      </div>

      {/* Game pills */}
      <div className="live-page__filter">
        <div className="live-page__pills">
          {GAMES.map((g) => (
            <button
              key={g}
              className={`game-pill ${activeGame === g ? "game-pill--active" : ""}`}
              onClick={() => setActiveGame(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Sort row */}
      <div className="live-page__sort">
        <span className="live-page__sort-label">
          {filteredStreams.length} streams đang live
        </span>
        <button
          className="live-page__sort-btn"
          onClick={() =>
            setSortBy((prev) => (prev === "viewers" ? "newest" : "viewers"))
          }
        >
          {sortBy === "viewers" ? "Viewers ↓" : "Mới nhất ↓"}
        </button>
      </div>

      {/* Stream grid */}
      {filteredStreams.length > 0 ? (
        <div className="live-page__grid">
          {filteredStreams.map((stream: Stream) => {
            const name =
              typeof stream.userId === "object"
                ? stream.userId.displayName || stream.userId.username
                : "Unknown";
            const avatar =
              typeof stream.userId === "object" ? stream.userId.avatar : null;

            return (
              <div
                className="live-card"
                key={stream._id}
                onClick={() => navigate(`/stream/${stream._id}`)}
              >
                {/* Thumbnail */}
                <div
                  className="live-card__thumb"
                  style={{ background: "#0a1a2e" }}
                >
                  {stream.thumbnailUrl && (
                    <img
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  <button className="live-card__play">
                    <Play size={14} fill="white" />
                  </button>
                  <span className="live-card__badge">LIVE</span>
                  <span className="live-card__viewers">
                    {formatViewers(stream.viewers)}
                  </span>
                </div>

                {/* Info */}
                <div className="live-card__info">
                  <div className="live-card__streamer">
                    <div
                      className="live-card__avatar"
                      style={{ background: generateColor(name) }}
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="live-card__name">{name}</span>
                  </div>
                  <div className="live-card__title">{stream.title}</div>
                  <div className="live-card__game">{stream.category}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="live-page__empty">
          <div className="live-page__empty-icon">📭</div>
          <p>Không có stream nào</p>
          <span>Thử chọn game khác hoặc quay lại sau</span>
        </div>
      )}
    </div>
  );
};

export default Live;