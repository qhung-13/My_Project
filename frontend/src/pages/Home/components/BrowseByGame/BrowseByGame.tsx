import "./BrowseByGame.css";
import { formatViewers } from "../../../../utils/format";

const BrowseByGame = () => {
  const games = [
    { id: 1, name: "Valorant", viewers: 24300, bg: "#1a0a2e" },
    { id: 2, name: "LOL", viewers: 51200, bg: "#0a1a2e" },
    { id: 3, name: "PUBG", viewers: 12800, bg: "#1a1a0a" },
    { id: 4, name: "CS2", viewers: 38100, bg: "#0a2a1a" },
    { id: 5, name: "Dota 2", viewers: 19400, bg: "#2a0a1a" },
    { id: 6, name: "FIFA", viewers: 8700, bg: "#1a0a0a" },
  ];

  return (
    <div className="browse">
      <div className="browse__header">
        <span className="browse__title">Browse by Game</span>
        <button className="browse__more">Xem tất cả</button>
      </div>

      <div className="browse__scroll">
        {games.map((game) => (
          <div className="game-card" key={game.id}>
            {/* Poster dọc 3:4 */}
            <div className="game-card__poster" style={{ background: game.bg }}>
              <span className="game-card__name">{game.name}</span>
              <span className="game-card__viewers">
                {formatViewers(game.viewers)} viewers
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseByGame;
