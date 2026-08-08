import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";
import { formatViewers } from "../../../../utils/format";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();
  const { data } = useGetLiveStreamsQuery({ page: 1, limit: 1 });
  const featuredStream = data?.streams?.[0];

  if (!featuredStream) return null;

  const streamerName =
    featuredStream.userId?.displayName ||
    featuredStream.userId?.username ||
    "Streamer";

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
              {featuredStream.userId?.avatar ? (
                <img src={featuredStream.userId.avatar} alt="" />
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
