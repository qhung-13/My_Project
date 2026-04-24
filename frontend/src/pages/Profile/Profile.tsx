import { useState } from "react";
import { useParams } from "react-router-dom";
import { useGetProfileQuery } from "../../store/api/userApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import EditProfile from "../../components/EditProfile/EditProfile";
import "./Profile.css";

type TabType = "VODs" | "Clips" | "About";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("VODs");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const isMyProfile = !userId || userId === "me";

  const { data: profile, isLoading } = useGetProfileQuery(undefined, {
    skip: !authUser || !isMyProfile,
  });

  if (isLoading) return <div className="profile__loading">Loading...</div>;

  // Dùng profile từ API nếu là my profile, sau này thêm API get by id
  const displayName =
    profile?.displayName || profile?.username || authUser?.username || "";
  const avatar = profile?.avatar || authUser?.avatar || null;
  const bio = profile?.bio || "";

  return (
    <div className="profile">
      {/* Banner */}
      <div className="profile__banner">
        <div className="profile__avatar">
          {avatar ? (
            <img src={avatar} alt={displayName} />
          ) : (
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        {isMyProfile && (
          <button
            className="profile__edit-btn"
            onClick={() => setShowEdit(true)}
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Info */}
      <div className="profile__info">
        <div className="profile__header">
          <div>
            <div className="profile__name-row">
              <span className="profile__username">{displayName}</span>
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
          {bio || (isMyProfile ? "Thêm bio của bạn..." : "")}
        </p>

        {/* Stats — sau này connect API */}
        <div className="profile__stats">
          {[
            { label: "Followers", value: 0 },
            { label: "Following", value: 0 },
            { label: "Streams", value: 0 },
          ].map((stat) => (
            <div className="profile__stat" key={stat.label}>
              <span className="profile__stat-value">{stat.value}</span>
              <span className="profile__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {isMyProfile && (
          <div className="profile__actions">
            <button className="profile__action-btn">⚙️ Cài đặt</button>
            <button className="profile__action-btn">📊 Dashboard</button>
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
        {activeTab === "VODs" && (
          <div className="profile__empty">
            <span>📹</span>
            <p>Chưa có VOD nào</p>
            {isMyProfile && <span>Bắt đầu stream để tạo VOD đầu tiên!</span>}
          </div>
        )}

        {activeTab === "Clips" && (
          <div className="profile__empty">
            <span>🎬</span>
            <p>Chưa có Clip nào</p>
          </div>
        )}

        {activeTab === "About" && (
          <div className="profile__about">
            <p>{bio || "Chưa có thông tin"}</p>
          </div>
        )}
      </div>

      {showEdit && (
        <EditProfile profile={profile} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};

export default Profile;
