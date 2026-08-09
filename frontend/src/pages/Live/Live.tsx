import { useMemo, useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import { formatViewers, generateColor } from "../../utils/format";
import type { Stream } from "../../types/index";
import "./Live.css";

type SortMode = "viewers" | "newest";

const Live = () => {
  const [activeGame, setActiveGame] = useState("All");
  const [sortBy, setSortBy] = useState<SortMode>("viewers");
  const navigate = useNavigate();
  const { data, isLoading, isError, isFetching, refetch } =
    useGetLiveStreamsQuery(
      { page: 1, limit: 50 },
      {
        pollingInterval: 10_000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
      },
    );

  const streams = data?.streams ?? [];
  const games = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(streams.map((stream) => stream.category).filter(Boolean)),
      ),
    ],
    [streams],
  );
  const filteredStreams = useMemo(
    () =>
      streams
        .filter(
          (stream) => activeGame === "All" || stream.category === activeGame,
        )
        .slice()
        .sort((first, second) =>
          sortBy === "viewers"
            ? second.viewers - first.viewers
            : new Date(second.startedAt || second.createdAt).getTime() -
              new Date(first.startedAt || first.createdAt).getTime(),
        ),
    [activeGame, sortBy, streams],
  );

  return (
    <div className="live-page">
      <header className="live-page__header">
        <h1 className="live-page__title">
          <span className="live-page__dot" aria-hidden="true" />
          Live
          <span className="live-page__count">
            {filteredStreams.length} streams
          </span>
        </h1>
      </header>

      <div className="live-page__filter">
        <div className="live-page__pills" aria-label="Lọc theo game">
          {games.map((game) => (
            <button
              type="button"
              key={game}
              className={`game-pill ${activeGame === game ? "game-pill--active" : ""}`}
              onClick={() => setActiveGame(game)}
              aria-pressed={activeGame === game}
            >
              {game === "All" ? "Tất cả" : game}
            </button>
          ))}
        </div>
      </div>

      <div className="live-page__sort">
        <span className="live-page__sort-label">
          {filteredStreams.length} streams đang live
        </span>
        <button
          type="button"
          className="live-page__sort-btn"
          onClick={() =>
            setSortBy((previous) =>
              previous === "viewers" ? "newest" : "viewers",
            )
          }
        >
          {sortBy === "viewers" ? "Nhiều người xem" : "Mới nhất"}
        </button>
      </div>

      {isLoading ? (
        <div className="live-page__loading" role="status">
          Đang tải livestream...
        </div>
      ) : isError ? (
        <div className="live-page__empty" role="alert">
          <p>Không thể tải danh sách livestream.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      ) : filteredStreams.length > 0 ? (
        <div className="live-page__grid">
          {filteredStreams.map((stream: Stream) => {
            const name =
              typeof stream.userId === "object"
                ? stream.userId.displayName || stream.userId.username
                : "Unknown";
            const avatar =
              typeof stream.userId === "object" ? stream.userId.avatar : null;

            return (
              <button
                type="button"
                className="live-card"
                key={stream._id}
                onClick={() => navigate(`/stream/${stream._id}`)}
                aria-label={`Xem ${stream.title} của ${name}`}
              >
                <span className="live-card__thumb">
                  {stream.thumbnailUrl ? (
                    <img src={stream.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="live-card__placeholder" aria-hidden="true">
                      {stream.category.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="live-card__play" aria-hidden="true">
                    <Play size={14} fill="currentColor" />
                  </span>
                  <span className="live-card__badge">LIVE</span>
                  <span className="live-card__viewers">
                    {formatViewers(stream.viewers)}
                  </span>
                </span>

                <span className="live-card__info">
                  <span className="live-card__streamer">
                    <span
                      className="live-card__avatar"
                      style={{ background: generateColor(name) }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="" loading="lazy" />
                      ) : (
                        name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="live-card__name">{name}</span>
                  </span>
                  <span className="live-card__title">{stream.title}</span>
                  <span className="live-card__game">{stream.category}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="live-page__empty">
          <div className="live-page__empty-icon" aria-hidden="true">
            📭
          </div>
          <p>Không có stream nào</p>
          <span>Thử chọn game khác hoặc quay lại sau.</span>
        </div>
      )}
    </div>
  );
};

export default Live;
