import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetLiveStreamsQuery,
  useGetTopStreamersByHoursQuery,
} from "../../../../store/api/streamApi";
import { useGetTopUsersQuery } from "../../../../store/api/userApi";
import type {
  LeaderboardItem,
  Stream,
  TopHoursUser,
  TopUser,
} from "../../../../types/index";
import { formatViewers, generateColor } from "../../../../utils/format";
import "./Leaderboard.css";

type TabType = "Viewers" | "Followers" | "Hours";

const TAB_LABELS: Record<TabType, string> = {
  Viewers: "Người xem",
  Followers: "Người theo dõi",
  Hours: "Giờ phát",
};

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>("Viewers");
  const navigate = useNavigate();
  const { data: liveResult } = useGetLiveStreamsQuery({ page: 1, limit: 12 });
  const { data: topUsers } = useGetTopUsersQuery(undefined);
  const { data: topHours } = useGetTopStreamersByHoursQuery(undefined);

  const currentData = useMemo<LeaderboardItem[]>(() => {
    if (activeTab === "Viewers") {
      return (liveResult?.streams ?? [])
        .slice(0, 5)
        .map((stream: Stream) => {
          const user = typeof stream.userId === "object" ? stream.userId : null;
          if (!user?._id) return null;
          return {
            id: stream._id,
            userId: user._id,
            name: user.displayName || user.username || "Unknown",
            avatar: user.avatar,
            value: formatViewers(stream.viewers),
            live: true,
          };
        })
        .filter((item): item is LeaderboardItem => item !== null);
    }

    if (activeTab === "Followers") {
      return (topUsers ?? []).slice(0, 5).map((user: TopUser) => ({
        id: user._id,
        userId: user._id,
        name: user.displayName || user.username,
        avatar: user.avatar,
        value: formatViewers(user.followersCount),
        live: false,
      }));
    }

    return (topHours ?? []).slice(0, 5).map((user: TopHoursUser) => ({
      id: user._id,
      userId: user._id,
      name: user.displayName || user.username,
      avatar: user.avatar,
      value: `${Math.max(0, user.totalHours).toLocaleString("vi-VN")} giờ`,
      live: false,
    }));
  }, [activeTab, liveResult?.streams, topHours, topUsers]);

  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <section className="leaderboard" aria-labelledby="leaderboard-heading">
      <div className="leaderboard__header">
        <h2 id="leaderboard-heading" className="leaderboard__title">
          Top Streamers
        </h2>
      </div>

      <div
        className="leaderboard__tabs"
        role="tablist"
        aria-label="Loại bảng xếp hạng"
      >
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {currentData.length === 0 ? (
        <p className="leaderboard__empty">Chưa có dữ liệu xếp hạng.</p>
      ) : (
        <>
          <div className="leaderboard__podium">
            {podiumOrder.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`podium-item rank-${index}`}
                onClick={() => navigate(`/profile/${item.userId}`)}
                aria-label={`Xem hồ sơ ${item.name}, ${item.value}`}
              >
                <span className="medal" aria-hidden="true">
                  {index === 1 ? "👑" : index === 0 ? "🥈" : "🥉"}
                </span>
                <span
                  className="avatar"
                  style={{ background: generateColor(item.name) }}
                >
                  {item.avatar ? (
                    <img src={item.avatar} alt="" loading="lazy" />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="name">{item.name}</span>
                <span className="value">{item.value}</span>
                {item.live && <span className="live-badge">LIVE</span>}
              </button>
            ))}
          </div>

          <div className="leaderboard__list">
            {rest.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className="list-item"
                onClick={() => navigate(`/profile/${item.userId}`)}
                aria-label={`Hạng ${index + 4}: ${item.name}, ${item.value}`}
              >
                <span className="rank">{index + 4}</span>
                <span
                  className="avatar small"
                  style={{ background: generateColor(item.name) }}
                >
                  {item.avatar ? (
                    <img src={item.avatar} alt="" loading="lazy" />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="name">{item.name}</span>
                <span className="value">{item.value}</span>
                {item.live && <span className="live-badge">LIVE</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Leaderboard;
