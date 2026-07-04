import { Play } from "lucide-react";
import { formatViewers, generateColor } from "../../../../utils/format";
import "./LiveNow.css";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";
import type { Stream } from "../../../../types/index";

const LiveNow = () => {
  const navigate = useNavigate();
  const { data: result, isLoading } = useGetLiveStreamsQuery(undefined);
  const streams = result?.streams || [];

  if (isLoading) {
    return <div className="live-now__loading">Loading...</div>;
  }

  if (!streams) {
    return null;
  }

  return (
    <div className="live-now">
      <div className="live-now__header">
        <div className="live-now__title">
          <span className="live-now__dot"></span>
          Live Now
        </div>
        <button className="live-now__more">Xem tất cả</button>
      </div>

      <div className="live-now__scroll">
        {streams.map((stream: Stream) => (
          <div
            className="stream-card"
            key={stream._id}
            onClick={() => navigate(`/stream/${stream._id}`)}
          >
            {/* Thumbnail */}
            <div
              className="stream-card__thumb"
              style={{
                background: generateColor(stream.userId?.username || ""),
              }}
            >
              {stream.thumbnailUrl && (
                <img
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              <button className="stream-card__play">
                <Play size={16} fill="white" />
              </button>
              <span className="stream-card__badge">LIVE</span>
              <span className="stream-card__viewers">
                {formatViewers(stream.viewers)} viewers
              </span>
            </div>

            <div className="stream-card__info">
              <div className="stream-card__streamer">
                <div
                  className="stream-card__avatar"
                  style={{
                    background: generateColor(stream.userId?.username) || "",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${stream.userId?._id}`);
                  }}
                >
                  {stream.userId?.avatar ? (
                    <img
                      src={stream.userId.avatar}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    stream.userId?.username?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="stream-card__name">
                  {stream.userId?.displayName || stream.userId?.username}
                </span>
              </div>
              <div className="stream-card__title">{stream.title}</div>
              <div className="stream-card__game">{stream.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveNow;
