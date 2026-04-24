import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProfileQuery,
  useGetUserByIdQuery,
} from "../../store/api/userApi";
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
  const isMyProfile = !userId || userId === "me" || userId === authUser?._id;

  // Fetch my profile
  const { data: myProfile, isLoading: isMyLoading } = useGetProfileQuery(
    undefined,
    {
      skip: !authUser || !isMyProfile,
    },
  );

  // Fetch other user profile
  const { data: otherProfile, isLoading: isOtherLoading } = useGetUserByIdQuery(
    userId!,
    {
      skip: isMyProfile || !userId,
    },
  );

  const isLoading = isMyLoading || isOtherLoading;
  if (isLoading) return <div className="profile__loading">Loading...</div>;

  const currentProfile = isMyProfile ? myProfile : otherProfile;

  const displayName =
    currentProfile?.displayName ||
    currentProfile?.username ||
    authUser?.username ||
    "";
  const avatar = currentProfile?.avatar || null;
  const bio = currentProfile?.bio || "";

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

        <p className="profile__bio">
          {bio || (isMyProfile ? "Thêm bio của bạn..." : "")}
        </p>

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
        <EditProfile profile={myProfile} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};

export default Profile;
