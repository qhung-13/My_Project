import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetUserByIdQuery } from "../../store/api/userApi";
import { useGetVideosByUserQuery } from "../../store/api/videoApi";
import {
  useGetScheduledStreamsByUserQuery,
  useGetLiveStreamsQuery,
} from "../../store/api/streamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "../../store/api/userApi";
import { generateColor, formatViewers } from "../../utils/format";
import type { Video, Stream } from "../../types/index";
import "./Channel.css";

type TabType = "VODs" | "Clips" | "Schedule" | "About";

const Channel = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("VODs");

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const { data: channelUser, isLoading } = useGetUserByIdQuery(userId!, {
    skip: !userId,
  });

  const { data: videosResult } = useGetVideosByUserQuery(
    { userId: userId!, page: 1, limit: 12 },
    { skip: !userId },
  );

  const { data: scheduledStreams } = useGetScheduledStreamsByUserQuery(
    userId!,
    { skip: !userId },
  );

  const { data: liveResult } = useGetLiveStreamsQuery({});

  // Check xem channel này có đang live không
  const liveStream = liveResult?.streams?.find(
    (s: Stream) => typeof s.userId === "object" && s.userId._id === userId,
  );

  const isFollowing =
    channelUser?.followers?.some(
      (id: string) => id.toString() === authUser?._id,
    ) ?? false;

  const handleFollow = async () => {
    if (!userId) return;
    try {
      if (isFollowing) await unfollowUser(userId).unwrap();
      else await followUser(userId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const vodVideos =
    videosResult?.videos?.filter((v: Video) => v.type === "vod") || [];
  const clipVideos =
    videosResult?.videos?.filter((v: Video) => v.type === "clip" || !v.type) ||
    [];

  const displayName =
    channelUser?.displayName || channelUser?.username || "Unknown";
  const avatar = channelUser?.avatar;

  if (isLoading) return <div className="channel__loading">Loading...</div>;
  if (!channelUser)
    return <div className="channel__loading">Channel không tồn tại</div>;

  return (
    <div className="channel">
      {/* ── Banner ── */}
      <div
        className="channel__banner"
        style={{
          backgroundImage: channelUser.bannerImage
            ? `url(${channelUser.bannerImage})`
            : undefined,
          background: channelUser.bannerImage
            ? undefined
            : `linear-gradient(135deg, ${generateColor(displayName)}, #1a1a2e)`,
        }}
      >
        {liveStream && (
          <div
            className="channel__live-badge"
            onClick={() => navigate(`/stream/${liveStream._id}`)}
          >
            🔴 ĐANG LIVE — {liveStream.title}
          </div>
        )}
      </div>

      {/* ── Channel Info ── */}
      <div className="channel__info">
        <div className="channel__avatar-wrap">
          <div
            className="channel__avatar"
            style={{ background: generateColor(displayName) }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
        </div>

        <div className="channel__meta">
          <div className="channel__name-row">
            <h1 className="channel__name">{displayName}</h1>
            {liveStream && <span className="channel__live-dot">🔴 LIVE</span>}
          </div>
          <div className="channel__stats">
            <span>{channelUser.followersCount || 0} followers</span>
            <span>·</span>
            <span>{vodVideos.length} VODs</span>
            <span>·</span>
            <span>{clipVideos.length} Clips</span>
          </div>
          <p className="channel__bio">{channelUser.bio || "Chưa có mô tả"}</p>
        </div>

        <div className="channel__actions">
          {liveStream && (
            <button
              className="channel__watch-btn"
              onClick={() => navigate(`/stream/${liveStream._id}`)}
            >
              🔴 Xem Live
            </button>
          )}
          {userId !== authUser?._id && (
            <button
              className={`channel__follow-btn ${isFollowing ? "channel__follow-btn--following" : ""}`}
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
          {userId === authUser?._id && (
            <button
              className="channel__edit-btn"
              onClick={() => navigate("/profile/me")}
            >
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="channel__tabs">
        {(["VODs", "Clips", "Schedule", "About"] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`channel__tab ${activeTab === tab ? "channel__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="channel__content">
        {/* VODs */}
        {activeTab === "VODs" &&
          (vodVideos.length > 0 ? (
            <div className="channel__grid">
              {vodVideos.map((video: Video) => (
                <div
                  key={video._id}
                  className="channel__video-card"
                  onClick={() => navigate(`/video/${video._id}`)}
                >
                  <div className="channel__video-thumb">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="channel__video-placeholder">
                        {video.category}
                      </div>
                    )}
                    <span className="channel__video-duration">
                      {video.duration}s
                    </span>
                  </div>
                  <div className="channel__video-info">
                    <p className="channel__video-title">{video.title}</p>
                    <p className="channel__video-meta">
                      {formatViewers(video.views)} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="channel__empty">
              <span>📹</span>
              <p>Chưa có VOD nào</p>
            </div>
          ))}

        {/* Clips */}
        {activeTab === "Clips" &&
          (clipVideos.length > 0 ? (
            <div className="channel__grid">
              {clipVideos.map((video: Video) => (
                <div
                  key={video._id}
                  className="channel__video-card"
                  onClick={() => navigate(`/video/${video._id}`)}
                >
                  <div className="channel__video-thumb">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="channel__video-placeholder">
                        {video.category}
                      </div>
                    )}
                    <span className="channel__video-duration">
                      {video.duration}s
                    </span>
                  </div>
                  <div className="channel__video-info">
                    <p className="channel__video-title">{video.title}</p>
                    <p className="channel__video-meta">
                      {formatViewers(video.views)} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="channel__empty">
              <span>🎬</span>
              <p>Chưa có Clip nào</p>
            </div>
          ))}

        {/* Schedule */}
        {activeTab === "Schedule" &&
          (scheduledStreams && scheduledStreams.length > 0 ? (
            <div className="channel__schedule">
              {scheduledStreams.map((stream: Stream) => (
                <div key={stream._id} className="channel__schedule-item">
                  <div className="channel__schedule-time">
                    📅 {new Date(stream.scheduledAt).toLocaleString("vi-VN")}
                  </div>
                  <div className="channel__schedule-title">{stream.title}</div>
                  <div className="channel__schedule-category">
                    {stream.category}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="channel__empty">
              <span>📅</span>
              <p>Chưa có lịch stream nào</p>
            </div>
          ))}

        {/* About */}
        {activeTab === "About" && (
          <div className="channel__about">
            <div className="channel__about-section">
              <h3>Giới thiệu</h3>
              <p>{channelUser.bio || "Streamer này chưa có mô tả."}</p>
            </div>
            <div className="channel__about-section">
              <h3>Thống kê</h3>
              <div className="channel__about-stats">
                <div>
                  👥 <strong>{channelUser.followersCount || 0}</strong>{" "}
                  Followers
                </div>
                <div>
                  👤 <strong>{channelUser.followingCount || 0}</strong>{" "}
                  Following
                </div>
                <div>
                  📹 <strong>{vodVideos.length}</strong> VODs
                </div>
                <div>
                  🎬 <strong>{clipVideos.length}</strong> Clips
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
