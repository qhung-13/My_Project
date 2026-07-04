import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { formatViewers, generateColor } from "../../utils/format";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import type { Stream } from "../../types/index";
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

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const gameName = GAME_NAMES[gameId ?? ""] ?? gameId;

  const { data: result, isLoading } = useGetLiveStreamsQuery({});
  const streams = (result?.streams || []).filter(
    (stream: Stream) =>
      stream.category?.toLowerCase() === gameName?.toLowerCase(),
  );

  if (isLoading) return <div className="game-detail__loading">Loading...</div>;

  return (
    <div className="game-detail">
      <div className="game-detail__header">
        <button className="game-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="game-detail__title">{gameName}</span>
        <span className="game-detail__count">{streams.length} streams</span>
      </div>

      {streams.length > 0 ? (
        <div className="game-detail__grid">
          {streams.map((stream: Stream) => {
            const name =
              typeof stream.userId === "object"
                ? stream.userId?.displayName || stream.userId?.username
                : "Unknown";
            return (
              <div
                className="gd-card"
                key={stream._id}
                onClick={() => navigate(`/stream/${stream._id}`)}
              >
                <div
                  className="gd-card__thumb"
                  style={{ background: "#0a1a2e" }}
                >
                  {stream.thumbnailUrl && (
                    <img
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <button className="gd-card__play">
                    <Play size={14} fill="white" />
                  </button>
                  <span className="gd-card__badge">LIVE</span>
                  <span className="gd-card__viewers">
                    {formatViewers(stream.viewers)} viewers
                  </span>
                </div>

                <div className="gd-card__info">
                  <div className="gd-card__streamer">
                    <div
                      className="gd-card__avatar"
                      style={{ background: generateColor(name || "") }}
                    >
                      {typeof stream.userId === "object" &&
                      stream.userId?.avatar ? (
                        <img
                          src={stream.userId.avatar}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="gd-card__name">{name}</span>
                  </div>
                  <div className="gd-card__title">{stream.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="game-detail__empty">
          <div className="game-detail__empty-icon">📭</div>
          <p>Chưa có stream nào cho {gameName}</p>
          <span>Quay lại sau nhé!</span>
        </div>
      )}
    </div>
  );
};

export default GameDetail;
