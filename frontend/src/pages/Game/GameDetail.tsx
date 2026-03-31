import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { formatViewers } from "../../utils/format";
import { STREAMS } from "../../data/stream";
import "./GameDetail.css";

const GAME_NAMES: Record<string, string> = {
  valorant: "Valorant",
  lol: "LOL",
  pubg: "PUBG",
  cs2: "CS2",
  dota2: "Dota 2",
  fifa: "FIFA",
  mlbb: "MLBB",
  cod: "COD",
};

// ============================================================
// Component
// ============================================================
const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const gameName = GAME_NAMES[gameId ?? ""] ?? gameId;
  const streams = STREAMS.filter(
    (stream) => stream.game.toLowerCase() === gameName.toLowerCase(),
  );

  return (
    <div className="game-detail">
      {/* Header */}
      <div className="game-detail__header">
        <button className="game-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="game-detail__title">{gameName}</span>
        <span className="game-detail__count">{streams.length} streams</span>
      </div>

      {/* Stream grid */}
      {streams.length > 0 ? (
        <div className="game-detail__grid">
          {streams.map((stream) => (
            <div
              className="gd-card"
              key={stream.id}
              onClick={() => navigate(`/stream/${stream.id}`)}
            >
              {/* Thumbnail */}
              <div className="gd-card__thumb" style={{ background: stream.bg }}>
                <button className="gd-card__play">
                  <Play size={14} fill="white" />
                </button>
                <span className="gd-card__badge">LIVE</span>
                <span className="gd-card__viewers">
                  {formatViewers(stream.viewers)} viewers
                </span>
              </div>

              {/* Info */}
              <div className="gd-card__info">
                <div className="gd-card__streamer">
                  <div
                    className="gd-card__avatar"
                    style={{ background: stream.avatarColor }}
                  >
                    {stream.initials}
                  </div>
                  <span className="gd-card__name">{stream.streamerName}</span>
                </div>
                <div className="gd-card__title">{stream.streamTitle}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-detail__empty">
          <div className="game-detail__empty-icon">📭</div>
          <p>Chưa có stream nào</p>
          <span>Quay lại sau nhé!</span>
        </div>
      )}
    </div>
  );
};

export default GameDetail;
