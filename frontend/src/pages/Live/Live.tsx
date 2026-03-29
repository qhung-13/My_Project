import { useState } from "react";
import { Play } from "lucide-react";
import { formatViewers } from "../../utils/format";
import "./Live.css";

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

const STREAMS = [
  {
    id: 1,
    streamerName: "TigerGaming",
    streamTitle: "Rank Challenger LOL",
    game: "LOL",
    viewers: 8100,
    bg: "#0a1a2e",
    initials: "TG",
    avatarColor: "#1877F2",
    region: "vn",
  },
  {
    id: 2,
    streamerName: "CSProVN",
    streamTitle: "Major highlights CS2",
    game: "CS2",
    viewers: 5600,
    bg: "#1a0a0a",
    initials: "CS",
    avatarColor: "#0F6E56",
    region: "vn",
  },
  {
    id: 3,
    streamerName: "NhokKute",
    streamTitle: "Cày rank Valorant",
    game: "Valorant",
    viewers: 2400,
    bg: "#1a0a2e",
    initials: "NK",
    avatarColor: "#E24B4A",
    region: "sea",
  },
  {
    id: 4,
    streamerName: "GalaxyX",
    streamTitle: "Esport recap Dota 2",
    game: "Dota 2",
    viewers: 1900,
    bg: "#0a2a1a",
    initials: "GX",
    avatarColor: "#534AB7",
    region: "kr",
  },
  {
    id: 5,
    streamerName: "ProBattle",
    streamTitle: "Squad mode PUBG",
    game: "PUBG",
    viewers: 1200,
    bg: "#2a0a1a",
    initials: "PB",
    avatarColor: "#854F0B",
    region: "sea",
  },
  {
    id: 6,
    streamerName: "MixGaming",
    streamTitle: "Clutch moments FIFA",
    game: "FIFA",
    viewers: 890,
    bg: "#1a1a0a",
    initials: "MX",
    avatarColor: "#993556",
    region: "na",
  },
  {
    id: 7,
    streamerName: "ProBattle",
    streamTitle: "Squad mode PUBG",
    game: "PUBG",
    viewers: 1200,
    bg: "#2a0a1a",
    initials: "PB",
    avatarColor: "#854F0B",
    region: "sea",
  },
  {
    id: 8,
    streamerName: "MixGaming",
    streamTitle: "Clutch moments FIFA",
    game: "FIFA",
    viewers: 890,
    bg: "#1a1a0a",
    initials: "MX",
    avatarColor: "#993556",
    region: "na",
  },
];

// ============================================================
// Component
// ============================================================
const Live = () => {
  const [activeRegion, setActiveRegion] = useState("all");
  const [activeGame, setActiveGame] = useState("All");
  const [sortBy, setSortBy] = useState<"viewers" | "newest">("viewers");

  const filteredStreams = STREAMS.filter(
    (s) => activeRegion === "all" || s.region === activeRegion,
  )
    .filter((s) => activeGame === "All" || s.game === activeGame)
    .sort((a, b) =>
      sortBy === "viewers" ? b.viewers - a.viewers : b.id - a.id,
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
            <div className="live-card" key={stream.id}>
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
