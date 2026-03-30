import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import { STREAMS } from "../../../../data/stream";
import "./LiveNow.css";
import { useNavigate } from "react-router-dom";

const LiveNow = () => {
  const navigate = useNavigate();

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
        {STREAMS.map((stream) => (
          <div className="stream-card" key={stream.id} onClick={() => navigate(`/stream/${stream.id}`)}>
            {/* Thumbnail */}
            <div className="stream-card__thumb">
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
                  style={{ background: stream.avatarColor }}
                >
                  {stream.initials}
                </div>
                <span className="stream-card__name">{stream.streamerName}</span>
              </div>
              <div className="stream-card__title">{stream.streamTitle}</div>
              <div className="stream-card__game">{stream.game}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveNow;
