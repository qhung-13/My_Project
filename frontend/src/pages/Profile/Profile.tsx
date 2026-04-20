import { useState } from "react";
import { useParams } from "react-router-dom";
import { MY_PROFILE, USERS } from "../../data/users";
import { Play } from "lucide-react";
import { formatViewers } from "../../utils/format";
import "./Profile.css";

type TabType = "VODs" | "Clips" | "About";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("VODs");
  const [isFollowing, setIsFollowing] = useState(false);

  const isMyProfile = !userId || userId === "me";
  const user = isMyProfile
    ? MY_PROFILE
    : (USERS.find((u) => u.id === userId) ?? MY_PROFILE);

  return (
    <div className="profile">
      {/* Banner */}
      <div className="profile__banner">
        <div
          className="profile__avatar"
          style={{ background: user.avatarColor }}
        >
          {user.initials}
        </div>
        {isMyProfile && (
          <button className="profile__edit-btn">Chỉnh sửa</button>
        )}
      </div>

      {/* Info */}
      <div className="profile__info">
        {/* Tên + button */}
        <div className="profile__header">
          <div>
            <div className="profile__name-row">
              <span className="profile__username">{user.username}</span>
              {user.isLive && <span className="profile__live-badge">LIVE</span>}
            </div>
            <div className="profile__sub">
              {user.games.slice(0, 2).join(" · ")} · {user.region.toUpperCase()}
            </div>
          </div>

          {isMyProfile ? (
            <button className="profile__go-live-btn">Go Live</button>
          ) : (
            <button
              className={`profile__follow-btn ${isFollowing ? "profile__follow-btn--following" : ""}`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
        </div>

        {/* Bio */}
        <p className="profile__bio">
          {user.bio || (isMyProfile ? "Thêm bio của bạn..." : "")}
        </p>

        {/* Stats */}
        <div className="profile__stats">
          {[
            { label: "Followers", value: formatViewers(user.followers) },
            { label: "Following", value: user.following },
            { label: "Streams", value: user.streams },
          ].map((stat) => (
            <div className="profile__stat" key={stat.label}>
              <span className="profile__stat-value">{stat.value}</span>
              <span className="profile__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Games hoặc Settings */}
        {isMyProfile ? (
          <div className="profile__actions">
            <button className="profile__action-btn">⚙️ Cài đặt</button>
            <button className="profile__action-btn">📊 Dashboard</button>
          </div>
        ) : (
          <div className="profile__games">
            {user.games.map((game) => (
              <span className="profile__game-tag" key={game}>
                {game}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="profile__tabs">
        {(["VODs", "Clips", "About"] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`profile__tab ${activeTab === tab ? "profile__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="profile__content">
        {activeTab === "VODs" &&
          (user.vods.length > 0 ? (
            <ul className="profile__vod-list">
              {user.vods.map((vod) => (
                <li className="vod-card" key={vod.id}>
                  <div
                    className="vod-card__thumb"
                    style={{ background: vod.bg }}
                  >
                    <Play size={14} fill="rgba(255,255,255,0.4)" />
                    <span className="vod-card__duration">{vod.duration}</span>
                  </div>
                  <div className="vod-card__info">
                    <div className="vod-card__title">{vod.title}</div>
                    <div className="vod-card__meta">
                      {formatViewers(vod.views)} views · {vod.daysAgo} ngày
                      trước
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="profile__empty">
              <span>📹</span>
              <p>Chưa có VOD nào</p>
              {isMyProfile && <span>Bắt đầu stream để tạo VOD đầu tiên!</span>}
            </div>
          ))}

        {activeTab === "Clips" && (
          <div className="profile__empty">
            <span>🎬</span>
            <p>Chưa có Clip nào</p>
          </div>
        )}

        {activeTab === "About" && (
          <div className="profile__about">
            <p>{user.bio || "Chưa có thông tin"}</p>
            <div className="profile__about-games">
              <span className="profile__about-label">Game hay chơi</span>
              <div className="profile__games">
                {user.games.length > 0 ? (
                  user.games.map((game) => (
                    <span className="profile__game-tag" key={game}>
                      {game}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#666", fontSize: "12px" }}>
                    Chưa có
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
