import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatViewers, generateColor } from "../../../utils/format";
import type { Stream } from "../../../types/index";

interface SuggestedStreamsProps {
  streams: Stream[];
  hideOnMobile: boolean;
}

const SuggestedStreams = ({ streams, hideOnMobile }: SuggestedStreamsProps) => {
  const navigate = useNavigate();

  return (
    <div className={`suggested ${hideOnMobile ? "suggested--hidden-mobile" : ""}`}>
      <h3 className="suggested__title">Stream khác</h3>
      <div className="suggested__list">
        {streams.map((stream) => {
          const name =
            typeof stream.userId === "object"
              ? stream.userId.displayName || stream.userId.username
              : "Unknown";
          return (
            <div
              className="suggested-card"
              key={stream._id}
              onClick={() => navigate(`/stream/${stream._id}`)}
            >
              <div
                className="suggested-card__thumb"
                style={{ background: "#0a1a2e" }}
              >
                <span className="suggested-card__badge">LIVE</span>
                <span className="suggested-card__viewers">
                  {formatViewers(stream.viewers)}
                </span>
                <Play size={12} fill="rgba(255,255,255,0.4)" />
              </div>
              <div className="suggested-card__info">
                <div className="suggested-card__title">{stream.title}</div>
                <div className="suggested-card__streamer">
                  <div
                    className="suggested-card__avatar"
                    style={{ background: generateColor(name) }}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedStreams;
