import { useState } from "react";
import "./Leaderboard.css";
import {
  useGetLiveStreamsQuery,
  useGetTopStreamersByHoursQuery,
} from "../../../../store/api/streamApi";
import { useGetTopUsersQuery } from "../../../../store/api/userApi";
import { generateColor } from "../../../../utils/format";
import { useNavigate } from "react-router-dom";
import type {
  Stream,
  LeaderboardItem,
  TopUser,
  TopHoursUser,
} from "../../../../types/index";

type TabType = "Viewers" | "Followers" | "Hours";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>("Viewers");
  const navigate = useNavigate();

  const { data: result } = useGetLiveStreamsQuery(undefined);
  const { data: topUsers } = useGetTopUsersQuery(undefined);
  const { data: topHours } = useGetTopStreamersByHoursQuery(undefined);

  const tabs: TabType[] = ["Viewers", "Followers", "Hours"];

  const getCurrentData = () => {
    if (activeTab === "Viewers") {
      return (result?.streams || []).slice(0, 5).map((s: Stream) => ({
        id: s._id,
        userId: s.userId?._id,
        name: s.userId?.displayName || s.userId?.username || "Unknown",
        avatar: s.userId?.avatar,
        value: `${(s.viewers / 1000).toFixed(1)}k`,
        live: true,
      }));
    }
    if (activeTab === "Followers") {
      return (topUsers || []).map((u: TopUser) => ({
        id: u._id,
        userId: u._id,
        name: u.displayName || u.username,
        avatar: u.avatar,
        value:
          u.followersCount >= 1000
            ? `${(u.followersCount / 1000).toFixed(1)}k`
            : `${u.followersCount}`,
        live: false,
      }));
    }
    if (activeTab === "Hours") {
      return (topHours || []).map((u: TopHoursUser) => ({
        id: u._id,
        userId: u._id,
        name: u.displayName || u.username,
        avatar: u.avatar,
        value: `${u.totalHours}h`,
        live: false,
      }));
    }
    return [];
  };

  const currentData = getCurrentData();
  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  if (currentData.length === 0) return null;

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <h2 className="leaderboard__title">Top Streamers</h2>
      </div>

      <div className="leaderboard__tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="leaderboard__podium">
        {podiumOrder.map((item: LeaderboardItem, index: number) => (
          <div
            key={item.id}
            className={`podium-item rank-${index}`}
            onClick={() => navigate(`/profile/${item.userId}`)}
            style={{ cursor: "pointer" }}
          >
            {index === 1 && <div className="medal">👑</div>}
            {index === 0 && <div className="medal">🥈</div>}
            {index === 2 && <div className="medal">🥉</div>}

            <div
              className="avatar"
              style={{ background: generateColor(item.name) }}
            >
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                item.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="name">{item.name}</div>
            <div className="value">{item.value}</div>
            {item.live && <span className="live-badge">LIVE</span>}
          </div>
        ))}
      </div>

      <div className="leaderboard__list">
        {rest.map((item: LeaderboardItem, index: number) => (
          <div
            key={item.id}
            className="list-item"
            onClick={() => navigate(`/profile/${item.userId}`)}
            style={{ cursor: "pointer" }}
          >
            <div className="rank">{index + 4}</div>
            <div
              className="avatar small"
              style={{ background: generateColor(item.name) }}
            >
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                item.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="name">{item.name}</div>
            <div className="value">{item.value}</div>
            {item.live && <span className="live-badge">LIVE</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
