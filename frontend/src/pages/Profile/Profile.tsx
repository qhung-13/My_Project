import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import {
  useGetProfileQuery,
  useGetUserByIdQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "../../store/api/userApi";
import { useGetVideosByUserQuery } from "../../store/api/videoApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { Video } from "../../types/index";
import EditProfile from "../../components/EditProfile/EditProfile";
import "./Profile.css";

type TabType = "VODs" | "Clips" | "About";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("VODs");
  const [showEdit, setShowEdit] = useState(false);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  const navigate = useNavigate();

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const isMyProfile = !userId || userId === "me" || userId === authUser?._id;

  const { data: myProfile, isLoading: isMyLoading } = useGetProfileQuery(
    undefined,
    {
      skip: !authUser || !isMyProfile,
    },
  );

  const { data: otherProfile, isLoading: isOtherLoading } = useGetUserByIdQuery(
    userId!,
    {
      skip: isMyProfile || !userId,
    },
  );

  const profileUserId = isMyProfile ? authUser?._id : otherProfile?._id;
  const { data: videos, isLoading: isVideosLoading } = useGetVideosByUserQuery(
    profileUserId,
    { skip: !profileUserId },
  );

  const isFollowing = isMyProfile
    ? false
    : (otherProfile?.followers?.some(
        (id: string) => id.toString() === authUser?._id,
      ) ?? false);

  const isLoading = isMyLoading || isOtherLoading;
  if (isLoading) return <div className="profile__loading">Loading...</div>;

  const displayName = isMyProfile
    ? myProfile?.displayName || myProfile?.username || authUser?.username || ""
    : otherProfile?.displayName || otherProfile?.username || "Unknown User";

  const avatar = isMyProfile
    ? myProfile?.avatar || null
    : otherProfile?.avatar || null;
  const bio = isMyProfile ? myProfile?.bio || "" : otherProfile?.bio || "";

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(userId!).unwrap();
      } else {
        await followUser(userId!).unwrap();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const vodVideos = videos?.filter((v: Video) => v.type === "vod") || [];

  const clipVideos = videos?.filter((v: Video) => v.type === "clip") || [];

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
              onClick={handleFollow}
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
            {
              label: "Followers",
              value: isMyProfile
                ? myProfile?.followersCount || 0
                : otherProfile?.followersCount || 0,
            },
            {
              label: "Following",
              value: isMyProfile
                ? myProfile?.followingCount || 0
                : otherProfile?.followingCount || 0,
            },
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
            <button
              className="profile__action-btn"
              onClick={() => navigate("/upload")}
            >
              ✂️ Upload Clip
            </button>
            <button className="profile__action-btn">⚙️ Cài đặt</button>
            <button
              className="profile__action-btn"
              onClick={() => navigate("/dashboard")}
            >
              📊 Dashboard
            </button>
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
          <div className="profile__content">
            {isVideosLoading ? (
              <div className="profile__loading">Loading...</div>
            ) : vodVideos.length > 0 ? (
              <ul className="profile__vod-list">
                {vodVideos.map((video: Video) => (
                  <li
                    className="vod-card"
                    key={video._id}
                    onClick={() => navigate(`/video/${video._id}`)}
                  >
                    <div className="vod-card__thumb">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} />
                      ) : (
                        <div className="vod-card__thumb-placeholder" />
                      )}
                      <span className="vod-card__duration">
                        {video.duration}s
                      </span>
                    </div>
                    <div className="vod-card__info">
                      <div className="vod-card__title">{video.title}</div>
                      <div className="vod-card__meta">
                        {video.views} views · {video.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="profile__empty">
                <span>📹</span>
                <p>Chưa có VOD nào</p>
                {isMyProfile && (
                  <span>Bắt đầu stream để tạo VOD đầu tiên!</span>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "Clips" && (
          <div className="profile__content">
            {isVideosLoading ? (
              <div className="profile__loading">Loading...</div>
            ) : clipVideos.length > 0 ? (
              <ul className="profile__vod-list">
                {clipVideos.map((video: Video) => (
                  <li
                    className="vod-card"
                    key={video._id}
                    onClick={() => navigate(`/video/${video._id}`)}
                  >
                    <div className="vod-card__thumb">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} />
                      ) : (
                        <div className="vod-card__thumb-placeholder" />
                      )}
                      <span className="vod-card__duration">
                        {video.duration}s
                      </span>
                    </div>
                    <div className="vod-card__info">
                      <div className="vod-card__title">{video.title}</div>
                      <div className="vod-card__meta">
                        {video.views} views · {video.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="profile__empty">
                <span>🎬</span>
                <p>Chưa có Clip nào</p>
                {isMyProfile && (
                  <button onClick={() => navigate("/upload")}>
                    Upload Clip đầu tiên!
                  </button>
                )}
              </div>
            )}
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
