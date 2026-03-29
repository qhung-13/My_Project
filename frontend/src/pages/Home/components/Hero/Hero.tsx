import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import "./Hero.css";

const Hero = () => {
  const featuredStream = {
    streamerName: "TigerGaming",
    streamTitle: "Rank Challenger LOL - Đường đến Thách Đấu",
    game: "League of Legends",
    viewers: 8100,
  };

  return (
    <div className="hero">
      <div className="hero__video">
        <button className="hero__play-btn">
          <Play size={20} fill="white" />
        </button>
        <div className="hero__overlay">
          <div className="hero__streamer">
            <div className="hero__avatar">TG</div>
            <span className="hero__name">{featuredStream.streamerName}</span>
            <span className="hero__badge-live">LIVE</span>
            <div className="viewers">
              {formatViewers(featuredStream.viewers)} đang xem
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
