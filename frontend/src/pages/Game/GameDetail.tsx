import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import { formatViewers, generateColor } from "../../utils/format";
import type { Stream } from "../../types/index";
import "./GameDetail.css";

const decodeCategory = (value?: string) => {
  if (!value) return "Danh mục";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const gameName = decodeCategory(gameId);
  const { data, isLoading, isError, isFetching, refetch } =
    useGetLiveStreamsQuery(
      { page: 1, limit: 50 },
      {
        pollingInterval: 10_000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
      },
    );

  const streams = (data?.streams ?? []).filter(
    (stream: Stream) =>
      stream.category?.trim().toLocaleLowerCase() ===
      gameName.trim().toLocaleLowerCase(),
  );

  return (
    <div className="game-detail">
      <header className="game-detail__header">
        <button
          type="button"
          className="game-detail__back"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="game-detail__title">{gameName}</h1>
        <span className="game-detail__count">{streams.length} streams</span>
      </header>

      {isLoading ? (
        <div className="game-detail__loading" role="status">
          Đang tải stream...
        </div>
      ) : isError ? (
        <div className="game-detail__empty" role="alert">
          <p>Không thể tải danh sách stream.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      ) : streams.length > 0 ? (
        <div className="game-detail__grid">
          {streams.map((stream: Stream) => {
            const name =
              typeof stream.userId === "object"
                ? stream.userId?.displayName || stream.userId?.username
                : "Unknown";
            const avatar =
              typeof stream.userId === "object" ? stream.userId.avatar : null;

            return (
              <button
                type="button"
                className="gd-card"
                key={stream._id}
                onClick={() => navigate(`/stream/${stream._id}`)}
                aria-label={`Xem ${stream.title} của ${name}`}
              >
                <span className="gd-card__thumb">
                  {stream.thumbnailUrl ? (
                    <img src={stream.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="gd-card__placeholder" aria-hidden="true">
                      {gameName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="gd-card__play" aria-hidden="true">
                    <Play size={14} fill="currentColor" />
                  </span>
                  <span className="gd-card__badge">LIVE</span>
                  <span className="gd-card__viewers">
                    {formatViewers(stream.viewers)} người xem
                  </span>
                </span>

                <span className="gd-card__info">
                  <span className="gd-card__streamer">
                    <span
                      className="gd-card__avatar"
                      style={{ background: generateColor(name || "") }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="" loading="lazy" />
                      ) : (
                        name?.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="gd-card__name">{name}</span>
                  </span>
                  <span className="gd-card__title">{stream.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="game-detail__empty">
          <div className="game-detail__empty-icon" aria-hidden="true">
            📭
          </div>
          <p>Chưa có stream nào cho {gameName}</p>
          <span>Hãy quay lại khi có streamer bắt đầu phát.</span>
        </div>
      )}
    </div>
  );
};

export default GameDetail;
