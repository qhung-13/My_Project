import { Play } from "lucide-react";
import { formatViewers } from "../../../../utils/format";
import "./Recommended.css";

const Recommended = () => {
  const recommended = [
    {
      id: 1,
      streamerName: "VNGamer",
      streamTitle: "VNGamer highlight reel",
      views: 320000,
      daysAgo: 2,
      bg: "#0d1a2e",
      initials: "VN",
      avatarColor: "#854F0B",
    },
    {
      id: 2,
      streamerName: "SkyKing",
      streamTitle: "SkyKing top 10 plays",
      views: 180000,
      daysAgo: 5,
      bg: "#1a0d2e",
      initials: "SK",
      avatarColor: "#534AB7",
    },
    {
      id: 3,
      streamerName: "GalaxyX",
      streamTitle: "GalaxyX esport recap",
      views: 95000,
      daysAgo: 7,
      bg: "#0d2e1a",
      initials: "GX",
      avatarColor: "#0F6E56",
    },
    {
      id: 4,
      streamerName: "MixGaming",
      streamTitle: "MixGaming clutch moments",
      views: 210000,
      daysAgo: 3,
      bg: "#2e0d1a",
      initials: "MX",
      avatarColor: "#993556",
    },
    {
      id: 5,
      streamerName: "VNGamer",
      streamTitle: "VNGamer highlight reel",
      views: 320000,
      daysAgo: 2,
      bg: "#0d1a2e",
      initials: "VN",
      avatarColor: "#854F0B",
    },
    {
      id: 6,
      streamerName: "SkyKing",
      streamTitle: "SkyKing top 10 plays",
      views: 180000,
      daysAgo: 5,
      bg: "#1a0d2e",
      initials: "SK",
      avatarColor: "#534AB7",
    },
    {
      id: 7,
      streamerName: "GalaxyX",
      streamTitle: "GalaxyX esport recap",
      views: 95000,
      daysAgo: 7,
      bg: "#0d2e1a",
      initials: "GX",
      avatarColor: "#0F6E56",
    },
    {
      id: 8,
      streamerName: "MixGaming",
      streamTitle: "MixGaming clutch moments",
      views: 210000,
      daysAgo: 3,
      bg: "#2e0d1a",
      initials: "MX",
      avatarColor: "#993556",
    },
  ];

  return (
    <div className="recommended">
      {/* Header */}
      <div className="recommended__header">
        <span className="recommended__title">Recommended</span>
        <button className="recommended__more">Xem tất cả</button>
      </div>

      {/* List dọc */}
      <div className="recommended__list">
        {recommended.map((item) => (
          <div className="rec-card" key={item.id}>
            <div className="rec-card__thumb" style={{ background: item.bg }}>
              <Play size={16} color="rgba(255,255,255,0.6)" />
            </div>

            <div className="rec-card__info">
              <div className="rec-card__title">{item.streamTitle}</div>
              <div className="rec-card__streamer">
                <div
                  className="rec-card__avatar"
                  style={{ background: item.avatarColor }}
                >
                  {item.initials}
                </div>
                <span>{item.streamerName}</span>
              </div>
              <div className="rec-card__meta">
                {formatViewers(item.views)} views · {item.daysAgo} ngày trước
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommended;
