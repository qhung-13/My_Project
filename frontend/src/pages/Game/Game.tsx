import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatViewers } from "../../utils/format";
import "./Game.css";

// ============================================================
// Constants
// ============================================================
const CATEGORIES = ["All", "Mobile", "PC", "Esport", "Other"];

const GAMES = [
  {
    id: "valorant",
    name: "Valorant",
    category: "PC",
    totalViewers: 24300,
    streams: 142,
    bg: "#1a0a2e",
  },
  {
    id: "lol",
    name: "League of Legends",
    category: "Esport",
    totalViewers: 51200,
    streams: 380,
    bg: "#0a1a2e",
  },
  {
    id: "pubg",
    name: "PUBG",
    category: "PC",
    totalViewers: 12800,
    streams: 98,
    bg: "#1a1a0a",
  },
  {
    id: "cs2",
    name: "CS2",
    category: "Esport",
    totalViewers: 38100,
    streams: 210,
    bg: "#0a2a1a",
  },
  {
    id: "dota2",
    name: "Dota 2",
    category: "Esport",
    totalViewers: 19400,
    streams: 156,
    bg: "#2a0a1a",
  },
  {
    id: "fifa",
    name: "FIFA",
    category: "PC",
    totalViewers: 8700,
    streams: 67,
    bg: "#1a0a0a",
  },
  {
    id: "mlbb",
    name: "Mobile Legends",
    category: "Mobile",
    totalViewers: 32100,
    streams: 245,
    bg: "#0a1a1a",
  },
  {
    id: "cod",
    name: "Call of Duty",
    category: "Mobile",
    totalViewers: 15600,
    streams: 112,
    bg: "#1a1a2a",
  },
];

// ============================================================
// Component
// ============================================================
const Game = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filteredGames = GAMES.filter(
    (g) => activeCategory === "All" || g.category === activeCategory,
  );

  return (
    <div className="game-page">
      {/* Header */}
      <div className="game-page__header">
        <h1 className="game-page__title">Game</h1>
        <span className="game-page__count">{filteredGames.length} games</span>
      </div>

      {/* Category pills */}
      <div className="game-page__pills">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`game-cat-pill ${activeCategory === cat ? "game-cat-pill--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div className="game-page__grid">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            className="game-banner"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            {/* Poster dọc 3:4 */}
            <div
              className="game-banner__poster"
              style={{ background: game.bg }}
            >
              <div className="game-banner__overlay">
                <span className="game-banner__name">{game.name}</span>
                <span className="game-banner__streams">
                  {game.streams} streams
                </span>
                <div className="game-banner__viewers">
                  {formatViewers(game.totalViewers)} viewers
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
