import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import { formatViewers } from "../../utils/format";
// import type { Stream } from "../../types/index";
import "./Game.css";

interface GameSummary {
  category: string;
  streams: number;
  totalViewers: number;
}

type SortMode = "viewers" | "streams";

const categorySlug = (category: string) => encodeURIComponent(category);

const Game = () => {
  const [sortMode, setSortMode] = useState<SortMode>("viewers");
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } =
    useGetLiveStreamsQuery(
      { page: 1, limit: 50 },
      {
        pollingInterval: 10_000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
      },
    );

  const games = useMemo(() => {
    const summaries = new Map<string, GameSummary>();
    for (const stream of data?.streams ?? []) {
      const category = stream.category?.trim() || "Other";
      const current = summaries.get(category) ?? {
        category,
        streams: 0,
        totalViewers: 0,
      };
      current.streams += 1;
      current.totalViewers += Math.max(0, stream.viewers || 0);
      summaries.set(category, current);
    }

    return [...summaries.values()].sort((first, second) =>
      sortMode === "viewers"
        ? second.totalViewers - first.totalViewers
        : second.streams - first.streams,
    );
  }, [data?.streams, sortMode]);

  return (
    <div className="game-page">
      <header className="game-page__header">
        <div>
          <p className="game-page__eyebrow">Khám phá nội dung</p>
          <h1 className="game-page__title">Danh mục đang phát trực tiếp</h1>
        </div>
        <span className="game-page__count">{games.length} danh mục</span>
      </header>

      <div className="game-page__toolbar" aria-label="Sắp xếp danh mục">
        <button
          type="button"
          className={
            sortMode === "viewers"
              ? "game-cat-pill game-cat-pill--active"
              : "game-cat-pill"
          }
          onClick={() => setSortMode("viewers")}
        >
          Nhiều người xem
        </button>
        <button
          type="button"
          className={
            sortMode === "streams"
              ? "game-cat-pill game-cat-pill--active"
              : "game-cat-pill"
          }
          onClick={() => setSortMode("streams")}
        >
          Nhiều kênh live
        </button>
      </div>

      {isLoading ? (
        <div className="game-page__state" role="status">
          Đang tải danh mục...
        </div>
      ) : isError ? (
        <div className="game-page__state" role="alert">
          <p>Không thể tải dữ liệu livestream.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="game-page__state">
          <Radio size={30} aria-hidden="true" />
          <p>Hiện chưa có danh mục nào đang phát trực tiếp.</p>
          <span>Danh mục sẽ xuất hiện khi streamer bắt đầu live.</span>
        </div>
      ) : (
        <div className="game-page__grid">
          {games.map((game, index) => (
            <button
              type="button"
              key={game.category}
              className="game-banner"
              onClick={() => navigate(`/game/${categorySlug(game.category)}`)}
              aria-label={`Xem ${game.streams} stream ${game.category}`}
            >
              <span
                className="game-banner__poster"
                style={
                  {
                    "--game-hue": String((index * 47 + 245) % 360),
                  } as CSSProperties
                }
              >
                <span className="game-banner__monogram" aria-hidden="true">
                  {game.category.slice(0, 2).toUpperCase()}
                </span>
                <span className="game-banner__overlay">
                  <span className="game-banner__name">{game.category}</span>
                  <span className="game-banner__streams">
                    {game.streams} {game.streams === 1 ? "stream" : "streams"}
                  </span>
                  <span className="game-banner__viewers">
                    {formatViewers(game.totalViewers)} người xem
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Game;
