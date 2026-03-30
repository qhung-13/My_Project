import { useState } from "react";
import { Play } from "lucide-react";
import { formatViewers } from "../../utils/format";
import { STREAMS } from "../../data/stream";
import "./Live.css";
import { useNavigate } from "react-router-dom";

// ============================================================
// Constants
// ============================================================
const REGIONS = [
  { label: "🌍 All", value: "all" },
  { label: "🇻🇳 Việt Nam", value: "vn" },
  { label: "🌏 SEA", value: "sea" },
  { label: "🇰🇷 Korea", value: "kr" },
  { label: "🇯🇵 Japan", value: "jp" },
  { label: "🇺🇸 NA", value: "na" },
];

const GAMES = ["All", "Valorant", "LOL", "PUBG", "CS2", "Dota 2", "FIFA"];

// ============================================================
// Component
// ============================================================
const Live = () => {
  const [activeRegion, setActiveRegion] = useState("all");
  const [activeGame, setActiveGame] = useState("All");
  const [sortBy, setSortBy] = useState<"viewers" | "newest">("viewers");
  const navigate = useNavigate();

  const filteredStreams = STREAMS.filter(
    (s) => activeRegion === "all" || s.region === activeRegion,
  )
    .filter((s) => activeGame === "All" || s.game === activeGame)
    .sort((a, b) =>
      sortBy === "viewers" ? b.viewers - a.viewers : b.createdAt - a.createdAt,
    );

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

      {/* Region pills */}
      <div className="live-page__filter">
        <div className="live-page__pills">
          {REGIONS.map((r) => (
            <button
              key={r.value}
              className={`live-pill ${activeRegion === r.value ? "live-pill--active" : ""}`}
              onClick={() => setActiveRegion(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Game pills */}
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
          {filteredStreams.map((stream) => (
            <div className="live-card" key={stream.id} onClick={() => navigate(`/stream/${stream.id}`)}>
              {/* Thumbnail */}
              <div
                className="live-card__thumb"
                style={{ background: stream.bg }}
              >
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
                    style={{ background: stream.avatarColor }}
                  >
                    {stream.initials}
                  </div>
                  <span className="live-card__name">{stream.streamerName}</span>
                </div>
                <div className="live-card__title">{stream.streamTitle}</div>
                <div className="live-card__game">{stream.game}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="live-page__empty">
          <div className="live-page__empty-icon">📭</div>
          <p>Không có stream nào</p>
          <span>Thử chọn khu vực hoặc game khác</span>
        </div>
      )}
    </div>
  );
};

export default Live;
