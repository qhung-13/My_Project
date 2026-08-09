import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Stream } from "../../../../types/index";
import { formatViewers } from "../../../../utils/format";
import "./Hero.css";

const Hero = ({ streams }: { streams: Stream[] }) => {
  const navigate = useNavigate();
  const featuredStream = streams[0];

  if (!featuredStream) return null;

  const user =
    typeof featuredStream.userId !== "string" ? featuredStream.userId : null;

  const streamerName = user?.displayName || user?.username || "Streamer";

  return (
    <section className="hero" aria-label="Livestream nổi bật">
      <button
        type="button"
        className="hero__video"
        onClick={() => navigate(`/stream/${featuredStream._id}`)}
        aria-label={`Xem livestream ${featuredStream.title} của ${streamerName}`}
      >
        {featuredStream.thumbnailUrl && (
          <img
            className="hero__thumbnail"
            src={featuredStream.thumbnailUrl}
            alt=""
            fetchPriority="high"
          />
        )}
        <span className="hero__play-btn" aria-hidden="true">
          <Play size={20} fill="currentColor" />
        </span>

        <span className="hero__overlay">
          <span className="hero__streamer">
            <span className="hero__avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                streamerName.slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="hero__name">{streamerName}</span>
            <span className="hero__badge-live">LIVE</span>
            <span className="hero__viewers">
              {formatViewers(featuredStream.viewers)} người xem
            </span>
          </span>
          <span className="hero__title">{featuredStream.title}</span>
          <span className="hero__game">{featuredStream.category}</span>
        </span>
      </button>
    </section>
  );
};

export default Hero;
