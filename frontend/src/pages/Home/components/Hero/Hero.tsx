import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import "./Hero.css";
import { useNavigate } from "react-router-dom";
import { useGetLiveStreamsQuery } from "../../../../store/api/streamApi";

const Hero = () => {
  const navigate = useNavigate();
  const { data: streams } = useGetLiveStreamsQuery(undefined);

  const featuredStream = streams?.[0];

  if (!featuredStream) {
    return null;
  }

  return (
    <div className="hero">
      <div
        className="hero__video"
        style={{ background: "#0a1a2e" }}
        onClick={() => navigate(`/stream/${featuredStream.id}`)}
      >
        <button className="hero__play-btn">
          <Play size={20} fill="white" />
        </button>

        <div className="hero__overlay">
          <div className="hero__streamer">
            <div className="hero__avatar">
              {featuredStream.userId?.avatar ? (
                <img src={featuredStream.userId.avatar} alt="" />
              ) : (
                featuredStream.userId?.username?.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="hero__name">
              {featuredStream.userId?.displayName ||
                featuredStream.userId?.username}
            </span>
            <span className="hero__badge-live">LIVE</span>
            <div className="hero__viewers">
              {formatViewers(featuredStream.viewers)} viewers
            </div>
          </div>
          <div className="hero__title">{featuredStream.title}</div>
          <div className="hero__game">{featuredStream.category}</div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
