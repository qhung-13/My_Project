import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import "./LiveNow.css";

const LiveNow = () => {
  const streams = [
    {
      id: 1,
      streamerName: "TigerGaming",
      streamTitle: "Rank Challenger LOL",
      game: "League of Legends",
      viewers: 8100,
      avatarColor: "#1877F2",
      initials: "TG",
    },
    {
      id: 2,
      streamerName: "NhokKute",
      streamTitle: "Cày rank Valorant",
      game: "Valorant",
      viewers: 2400,
      avatarColor: "#E24B4A",
      initials: "NK",
    },
    {
      id: 3,
      streamerName: "ProBattle",
      streamTitle: "Squad mode PUBG",
      game: "PUBG",
      viewers: 1200,
      avatarColor: "#854F0B",
      initials: "PB",
    },
    {
      id: 4,
      streamerName: "CSProVN",
      streamTitle: "Major highlights CS2",
      game: "CS2",
      viewers: 5600,
      avatarColor: "#0F6E56",
      initials: "CS",
    },
    {
      id: 5,
      streamName: "TigerGaming",
      streamTitle: "Rank Challenger LOL",
      game: "League of Legends",
      viewers: 8100,
      avatarColor: "#1877F2",
      initial: "TG",
    },
    {
      id: 6,
      streamerName: "NhokKute",
      streamTitle: "Cày rank Valorant",
      game: "Valorant",
      viewers: 2400,
      avatarColor: "#E24B4A",
      initials: "NK",
    },
    {
      id: 7,
      streamerName: "ProBattle",
      streamTitle: "Squad mode PUBG",
      game: "PUBG",
      viewers: 1200,
      avatarColor: "#854F0B",
      initials: "PB",
    },
    {
      id: 8,
      streamerName: "CSProVN",
      streamTitle: "Major highlights CS2",
      game: "CS2",
      viewers: 5600,
      avatarColor: "#0F6E56",
      initials: "CS",
    },
  ];

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
        {streams.map((stream) => (
          <div className="stream-card" key={stream.id}>
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
