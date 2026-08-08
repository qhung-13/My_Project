import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";
import type { Stream } from "../../../../types/index";
import { formatViewers, generateColor } from "../../../../utils/format";
import "./LiveNow.css";

const LiveNow = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetLiveStreamsQuery({
    page: 1,
    limit: 12,
  });
  const streams = data?.streams ?? [];

  if (isLoading)
    return (
      <div className="live-now__loading" role="status">
        Đang tải livestream...
      </div>
    );
  if (isError || streams.length === 0) return null;

  return (
    <section className="live-now" aria-labelledby="live-now-heading">
      <div className="live-now__header">
        <h2 id="live-now-heading" className="live-now__title">
          <span className="live-now__dot" aria-hidden="true" />
          Đang trực tiếp
        </h2>
        <button
          type="button"
          className="live-now__more"
          onClick={() => navigate("/live")}
        >
          Xem tất cả
        </button>
      </div>

      <div className="live-now__scroll">
        {streams.map((stream: Stream) => {
          const streamerName =
            stream.userId?.displayName || stream.userId?.username || "Streamer";
          return (
            <button
              type="button"
              className="stream-card"
              key={stream._id}
              onClick={() => navigate(`/stream/${stream._id}`)}
              aria-label={`Xem ${stream.title} của ${streamerName}`}
            >
              <span
                className="stream-card__thumb"
                style={{
                  background: generateColor(stream.userId?.username || ""),
                }}
              >
                {stream.thumbnailUrl && (
                  <img src={stream.thumbnailUrl} alt="" loading="lazy" />
                )}
                <span className="stream-card__play" aria-hidden="true">
                  <Play size={16} fill="currentColor" />
                </span>
                <span className="stream-card__badge">LIVE</span>
                <span className="stream-card__viewers">
                  {formatViewers(stream.viewers)} người xem
                </span>
              </span>

              <span className="stream-card__info">
                <span className="stream-card__streamer">
                  <span
                    className="stream-card__avatar"
                    style={{ background: generateColor(streamerName) }}
                  >
                    {stream.userId?.avatar ? (
                      <img src={stream.userId.avatar} alt="" loading="lazy" />
                    ) : (
                      streamerName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="stream-card__name">{streamerName}</span>
                </span>
                <span className="stream-card__title">{stream.title}</span>
                <span className="stream-card__game">{stream.category}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default LiveNow;
