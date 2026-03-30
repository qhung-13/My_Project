import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import { STREAMS } from "../../../../data/stream";
import "./Hero.css";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const featuredStream = STREAMS[0];

  return (
    <div className="hero">
      <div
        className="hero__video"
        onClick={() => navigate(`/stream/${featuredStream.id}`)}
      >
        <button className="hero__play-btn">
          <Play size={20} fill="white" />
        </button>

        <div className="hero__overlay">
          <div className="hero__streamer">
            <div className="hero__avatar">{featuredStream.initials}</div>{" "}
            {/* ← dynamic */}
            <span className="hero__name">
              {featuredStream.streamerName}
            </span>{" "}
            {/* ← fix */}
            <span className="hero__badge-live">LIVE</span>
            <div className="hero__viewers">
              {formatViewers(featuredStream.viewers)} viewers
            </div>
          </div>
          <div className="hero__title">{featuredStream.streamTitle}</div>
          <div className="hero__game">{featuredStream.game}</div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
