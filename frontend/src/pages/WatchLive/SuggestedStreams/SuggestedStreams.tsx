import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Stream } from "../../../types/index";
import { formatViewers, generateColor } from "../../../utils/format";

interface SuggestedStreamsProps {
  streams: Stream[];
  hideOnMobile: boolean;
}

const SuggestedStreams = ({ streams, hideOnMobile }: SuggestedStreamsProps) => {
  const navigate = useNavigate();
  if (streams.length === 0) return null;

  return (
    <section
      className={`suggested ${hideOnMobile ? "suggested--hidden-mobile" : ""}`}
      aria-labelledby="suggested-streams-title"
    >
      <h2 id="suggested-streams-title" className="suggested__title">
        Stream khác
      </h2>
      <div className="suggested__list">
        {streams.map((stream) => {
          const name =
            typeof stream.userId === "object"
              ? stream.userId.displayName || stream.userId.username
              : "Unknown";
          const avatar =
            typeof stream.userId === "object" ? stream.userId.avatar : null;
          return (
            <button
              type="button"
              className="suggested-card"
              key={stream._id}
              onClick={() => navigate(`/stream/${stream._id}`)}
              aria-label={`Xem ${stream.title} của ${name}`}
            >
              <span className="suggested-card__thumb">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <Play size={18} aria-hidden="true" />
                )}
                <span className="suggested-card__badge">LIVE</span>
                <span className="suggested-card__viewers">
                  {formatViewers(stream.viewers)}
                </span>
              </span>
              <span className="suggested-card__info">
                <span className="suggested-card__title">{stream.title}</span>
                <span className="suggested-card__streamer">
                  <span
                    className="suggested-card__avatar"
                    style={{ background: generateColor(name) }}
                  >
                    {avatar ? (
                      <img src={avatar} alt="" loading="lazy" />
                    ) : (
                      name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span>{name}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SuggestedStreams;
