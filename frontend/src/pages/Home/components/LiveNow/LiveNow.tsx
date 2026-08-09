import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Stream } from "../../../../types/index";
import { formatViewers, generateColor } from "../../../../utils/format";
import { getStreamUser } from "../../../../utils/streamUser";
import "./LiveNow.css";

interface LiveNowProps {
  streams: Stream[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const LiveNow = ({ streams, isLoading, isError, onRetry }: LiveNowProps) => {
  const navigate = useNavigate();

  if (isLoading)
    return (
      <div className="live-now__loading" role="status">
        Đang tải livestream...
      </div>
    );
  if (isError) {
    return (
      <section className="live-now" aria-labelledby="live-now-heading">
        <div className="live-now__header">
          <h2 id="live-now-heading" className="live-now__title">
            <span className="live-now__dot" aria-hidden="true" />
            Đang trực tiếp
          </h2>
        </div>
        <div className="live-now__state" role="alert">
          <strong>Không tải được livestream.</strong>
          <span>Kiểm tra kết nối rồi thử lại.</span>
          <button type="button" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  if (streams.length === 0) {
    return (
      <section className="live-now" aria-labelledby="live-now-heading">
        <div className="live-now__header">
          <h2 id="live-now-heading" className="live-now__title">
            <span className="live-now__dot" aria-hidden="true" />
            Đang trực tiếp
          </h2>
        </div>
        <div className="live-now__state">
          <strong>Chưa có kênh nào đang live.</strong>
          <span>Khám phá VOD trong lúc chờ streamer lên sóng.</span>
        </div>
      </section>
    );
  }

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
          const streamUser = getStreamUser(stream.userId);
          const streamerName =
            streamUser?.displayName || streamUser?.username || "Streamer";
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
                  background: generateColor(streamUser?.username || ""),
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
                    {streamUser?.avatar ? (
                      <img src={streamUser.avatar} alt="" loading="lazy" />
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
