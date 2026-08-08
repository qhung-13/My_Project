import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useFollowUserMutation,
  useGetProfileQuery,
  useGetUserByIdQuery,
  useUnfollowUserMutation,
  useUpdateBannerMutation,
} from "../../store/api/userApi";
import { useGetVideosByUserQuery } from "../../store/api/videoApi";
import {
  useGetScheduledStreamsByUserQuery,
  useGetStreamsByUserQuery,
} from "../../store/api/streamApi";
import type { RootState } from "../../store/store";
import type { Stream, Video } from "../../types/index";
import EditProfile from "../../components/EditProfile/EditProfile";
import GoLiveModal from "../../components/GoLiveModal/GoLiveModal";
import "./Profile.css";

type TabType = "VODs" | "Clips" | "Schedule" | "About";

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const ProfileVideoList = ({
  videos,
  emptyIcon,
  emptyText,
  onSelect,
}: {
  videos: Video[];
  emptyIcon: string;
  emptyText: string;
  onSelect: (videoId: string) => void;
}) => {
  if (videos.length === 0) {
    return (
      <div className="profile__empty">
        <span aria-hidden="true">{emptyIcon}</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="profile__vod-list">
      {videos.map((video) => (
        <li key={video._id}>
          <button
            type="button"
            className="vod-card"
            onClick={() => onSelect(video._id)}
          >
            <div className="vod-card__thumb">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                <div className="vod-card__thumb-placeholder" />
              )}
              <span className="vod-card__duration">
                {formatDuration(video.duration)}
              </span>
            </div>
            <div className="vod-card__info">
              <span className="vod-card__title">{video.title}</span>
              <span className="vod-card__meta">
                {video.views.toLocaleString()} lượt xem · {video.category}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>("VODs");
  const [showEdit, setShowEdit] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);
  const [feedback, setFeedback] = useState("");

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const isMyProfile = !userId || userId === "me" || userId === authUser?._id;

  const {
    data: myProfile,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useGetProfileQuery(undefined, {
    skip: !authUser || !isMyProfile,
  });
  const {
    data: otherProfile,
    isLoading: isOtherLoading,
    isError: isOtherError,
  } = useGetUserByIdQuery(userId!, {
    skip: isMyProfile || !userId,
  });

  const profile = isMyProfile ? myProfile : otherProfile;
  const profileUserId = isMyProfile ? authUser?._id : otherProfile?._id;

  const {
    data: videosResult,
    isLoading: isVideosLoading,
    isError: isVideosError,
  } = useGetVideosByUserQuery(
    { userId: profileUserId || "", page: 1, limit: 24 },
    { skip: !profileUserId },
  );
  const { data: streamsResult } = useGetStreamsByUserQuery(
    { userId: profileUserId || "", page: 1, limit: 1 },
    { skip: !profileUserId },
  );
  const { data: scheduledStreams, isError: isScheduleError } =
    useGetScheduledStreamsByUserQuery(profileUserId!, {
      skip: !profileUserId,
    });

  const [followUser, { isLoading: isFollowingMutation }] =
    useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingMutation }] =
    useUnfollowUserMutation();
  const [updateBanner, { isLoading: isUpdatingBanner }] =
    useUpdateBannerMutation();

  const isFollowing =
    !isMyProfile &&
    Boolean(
      otherProfile?.followers?.some(
        (id: string) => id.toString() === authUser?._id,
      ),
    );

  const isLoading = isMyLoading || isOtherLoading;
  if (isLoading) {
    return (
      <div className="profile__loading" role="status">
        Đang tải...
      </div>
    );
  }
  if (isMyError || isOtherError || !profile) {
    return (
      <div className="profile__empty" role="alert">
        <span aria-hidden="true">👤</span>
        <p>Không thể tải hồ sơ này.</p>
      </div>
    );
  }

  const displayName = profile.displayName || profile.username || "Unknown User";
  const avatar = profile.avatar || null;
  const bio = profile.bio || "";
  const videos = videosResult?.videos || [];
  const vodVideos = videos.filter((video: Video) => video.type === "vod");
  const clipVideos = videos.filter(
    (video: Video) => video.type === "clip" || !video.type,
  );

  const handleFollow = async () => {
    if (!userId || !authUser) {
      setFeedback("Bạn cần đăng nhập để theo dõi kênh này.");
      return;
    }

    setFeedback("");
    try {
      if (isFollowing) await unfollowUser(userId).unwrap();
      else await followUser(userId).unwrap();
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      setFeedback(
        apiError.data?.message || "Không thể cập nhật trạng thái theo dõi.",
      );
    }
  };

  const handleBannerChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("Ảnh bìa phải là tệp hình ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback("Ảnh bìa không được vượt quá 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("banner", file);
    setFeedback("");
    try {
      await updateBanner(formData).unwrap();
      setFeedback("Đã cập nhật ảnh bìa.");
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      setFeedback(apiError.data?.message || "Không thể cập nhật ảnh bìa.");
    }
  };

  const tabs: TabType[] = ["VODs", "Clips", "Schedule", "About"];

  return (
    <div className="profile">
      <div
        className="profile__banner"
        style={
          profile.bannerImage
            ? {
                backgroundImage: `url(${profile.bannerImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {isMyProfile && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleBannerChange}
            />
            <button
              type="button"
              className="profile__banner-edit"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUpdatingBanner}
            >
              {isUpdatingBanner ? "Đang tải..." : "📷 Đổi ảnh bìa"}
            </button>
          </>
        )}

        <div className="profile__avatar">
          {avatar ? (
            <img src={avatar} alt={`Ảnh đại diện của ${displayName}`} />
          ) : (
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        {isMyProfile && (
          <button
            type="button"
            className="profile__edit-btn"
            onClick={() => setShowEdit(true)}
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="profile__info">
        <div className="profile__header">
          <div className="profile__name-row">
            <h1 className="profile__username">{displayName}</h1>
          </div>

          {isMyProfile ? (
            <button
              type="button"
              className="profile__go-live-btn"
              onClick={() => setShowGoLive(true)}
            >
              Go Live
            </button>
          ) : (
            <button
              type="button"
              className={`profile__follow-btn ${isFollowing ? "profile__follow-btn--following" : ""}`}
              onClick={handleFollow}
              disabled={isFollowingMutation || isUnfollowingMutation}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
        </div>

        <p className={`profile__bio ${bio ? "" : "placeholder"}`}>
          {bio || (isMyProfile ? "Thêm bio của bạn..." : "Chưa có giới thiệu.")}
        </p>
        {feedback && (
          <p className="profile__feedback" role="status">
            {feedback}
          </p>
        )}

        <div className="profile__stats">
          <div className="profile__stat">
            <span className="profile__stat-value">
              {profile.followersCount || 0}
            </span>
            <span className="profile__stat-label">Followers</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">
              {profile.followingCount || 0}
            </span>
            <span className="profile__stat-label">Following</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">
              {streamsResult?.pagination.total || 0}
            </span>
            <span className="profile__stat-label">Streams</span>
          </div>
        </div>

        {isMyProfile && (
          <div className="profile__actions">
            <button
              type="button"
              className="profile__action-btn"
              onClick={() => navigate("/upload")}
            >
              ⬆️ Upload video
            </button>
            <button
              type="button"
              className="profile__action-btn"
              onClick={() => navigate("/dashboard")}
            >
              📊 Dashboard
            </button>
          </div>
        )}
      </div>

      <div className="profile__tabs" role="tablist" aria-label="Nội dung hồ sơ">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            key={tab}
            className={`profile__tab ${activeTab === tab ? "profile__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="profile__content" role="tabpanel">
        {isVideosError && (activeTab === "VODs" || activeTab === "Clips") ? (
          <div className="profile__empty" role="alert">
            <span aria-hidden="true">⚠️</span>
            <p>Không thể tải danh sách video.</p>
          </div>
        ) : isVideosLoading &&
          (activeTab === "VODs" || activeTab === "Clips") ? (
          <div className="profile__loading" role="status">
            Đang tải...
          </div>
        ) : activeTab === "VODs" ? (
          <ProfileVideoList
            videos={vodVideos}
            emptyIcon="📹"
            emptyText="Chưa có VOD nào"
            onSelect={(id) => navigate(`/video/${id}`)}
          />
        ) : activeTab === "Clips" ? (
          <ProfileVideoList
            videos={clipVideos}
            emptyIcon="🎬"
            emptyText="Chưa có Clip nào"
            onSelect={(id) => navigate(`/video/${id}`)}
          />
        ) : activeTab === "Schedule" ? (
          isScheduleError ? (
            <div className="profile__empty" role="alert">
              <span aria-hidden="true">⚠️</span>
              <p>Không thể tải lịch livestream.</p>
            </div>
          ) : scheduledStreams?.length ? (
            <div className="schedule-list">
              {scheduledStreams.map((stream: Stream) => (
                <article className="schedule-item" key={stream._id}>
                  <time
                    className="schedule-item__time"
                    dateTime={stream.scheduledAt || undefined}
                  >
                    📅{" "}
                    {stream.scheduledAt
                      ? new Date(stream.scheduledAt).toLocaleString("vi-VN")
                      : "Chưa xác định"}
                  </time>
                  <h2 className="schedule-item__title">{stream.title}</h2>
                  <p className="schedule-item__category">{stream.category}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="profile__empty">
              <span aria-hidden="true">📅</span>
              <p>Chưa có lịch stream nào</p>
            </div>
          )
        ) : (
          <div className="profile__about">
            <p>{bio || "Chưa có thông tin"}</p>
          </div>
        )}
      </div>

      {showEdit && myProfile && (
        <EditProfile profile={myProfile} onClose={() => setShowEdit(false)} />
      )}
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}
    </div>
  );
};

export default Profile;
