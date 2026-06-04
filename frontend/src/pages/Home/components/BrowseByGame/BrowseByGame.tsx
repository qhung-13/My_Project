import "./BrowseByGame.css";
import { formatViewers } from "../../../../utils/format";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";
import { useNavigate } from "react-router-dom";
import type { Stream } from "../../../../types/index";

const GAME_COLORS: Record<string, string> = {
  Valorant: "#1a0a2e",
  LOL: "#0a1a2e",
  PUBG: "#1a1a0a",
  CS2: "#0a2a1a",
  "Dota 2": "#2a0a1a",
  FIFA: "#1a0a0a",
  MLBB: "#0a1a1a",
  COD: "#1a1a2a",
};

const BrowseByGame = () => {
  const navigate = useNavigate();
  const { data: liveStreams } = useGetLiveStreamsQuery(undefined);

  // Tính tổng viewers theo game từ live streams
  const gameMap = new Map<string, number>();
  (liveStreams || []).forEach((stream: Stream) => {
    const game = stream.category;
    if (!game) return;
    gameMap.set(game, (gameMap.get(game) || 0) + stream.viewers);
  });

  // Convert sang array và sort theo viewers
  const games = Array.from(gameMap.entries())
    .map(([name, viewers]) => ({ name, viewers }))
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 6);

  // Nếu không có stream thật thì dùng data mặc định
  const displayGames =
    games.length > 0
      ? games
      : [
          { name: "Valorant", viewers: 0 },
          { name: "LOL", viewers: 0 },
          { name: "PUBG", viewers: 0 },
          { name: "CS2", viewers: 0 },
          { name: "Dota 2", viewers: 0 },
          { name: "FIFA", viewers: 0 },
        ];

  return (
    <div className="browse">
      <div className="browse__header">
        <span className="browse__title">Browse by Game</span>
        <button className="browse__more" onClick={() => navigate("/game")}>
          Xem tất cả
        </button>
      </div>

      <div className="browse__scroll">
        {displayGames.map((game) => (
          <div
            className="game-card"
            key={game.name}
            onClick={() => navigate(`/search?q=${game.name}`)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="game-card__poster"
              style={{ background: GAME_COLORS[game.name] || "#1a1a2e" }}
            >
              <span className="game-card__name">{game.name}</span>
              <span className="game-card__viewers">
                {game.viewers > 0
                  ? `${formatViewers(game.viewers)} viewers`
                  : "No streams"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseByGame;
