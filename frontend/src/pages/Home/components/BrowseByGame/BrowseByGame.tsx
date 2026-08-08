import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";
import type { Stream } from "../../../../types/index";
import { formatViewers } from "../../../../utils/format";
import "./BrowseByGame.css";

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
  const { data } = useGetLiveStreamsQuery({ page: 1, limit: 50 });
  const gameMap = new Map<string, number>();
  (data?.streams ?? []).forEach((stream: Stream) => {
    const game = stream.category?.trim();
    if (game)
      gameMap.set(game, (gameMap.get(game) ?? 0) + Math.max(0, stream.viewers));
  });
  const games = [...gameMap.entries()]
    .map(([name, viewers]) => ({ name, viewers }))
    .sort((first, second) => second.viewers - first.viewers)
    .slice(0, 6);

  if (games.length === 0) return null;

  return (
    <section className="browse" aria-labelledby="browse-heading">
      <div className="browse__header">
        <h2 id="browse-heading" className="browse__title">
          Khám phá theo game
        </h2>
        <button
          type="button"
          className="browse__more"
          onClick={() => navigate("/game")}
        >
          Xem tất cả
        </button>
      </div>

      <div className="browse__scroll">
        {games.map((game) => (
          <button
            type="button"
            className="game-card"
            key={game.name}
            onClick={() => navigate(`/game/${encodeURIComponent(game.name)}`)}
            aria-label={`Xem stream ${game.name}`}
          >
            <span
              className="game-card__poster"
              style={{ background: GAME_COLORS[game.name] || "#1a1a2e" }}
            >
              <span className="game-card__name">{game.name}</span>
              <span className="game-card__viewers">
                {formatViewers(game.viewers)} người xem
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default BrowseByGame;
