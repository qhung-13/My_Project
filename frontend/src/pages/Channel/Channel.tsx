import { useState } from "react";
import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "../../store/api/userApi";
import { useGetVideosByUserQuery } from "../../store/api/videoApi";
import {
  useGetScheduledStreamsByUserQuery,
  useGetStreamsByUserQuery,
} from "../../store/api/streamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "../../store/api/userApi";
import type { Video, Stream } from "../../types/index";
import ChannelHeader from "./ChannelHeader/ChannelHeader";
import VideoGrid from "./VideoGrid/VideoGrid";
import ScheduleTab from "./ScheduleTab/ScheduleTab";
import AboutTab from "./AboutTab/AboutTab";
import "./Channel.css";

type TabType = "VODs" | "Clips" | "Schedule" | "About";

// Page-level orchestrator: fetches channel data and composes the header +
// whichever tab is active. Each tab (and the header) is its own component
// under this folder; VODs/Clips share a single <VideoGrid> instead of two
// near-identical ~35-line blocks (as in the original).
const Channel = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("VODs");
  const [followError, setFollowError] = useState("");

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser, { isLoading: isFollowingUser }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingUser }] =
    useUnfollowUserMutation();

  const { data: channelUser, isLoading } = useGetUserByIdQuery(userId!, {
    skip: !userId,
  });

  const { data: videosResult } = useGetVideosByUserQuery(
    { userId: userId!, page: 1, limit: 50 },
    { skip: !userId },
  );

  const { data: scheduledStreams } = useGetScheduledStreamsByUserQuery(
    userId!,
    { skip: !userId },
  );

  const { data: channelStreams } = useGetStreamsByUserQuery(
    { userId: userId!, page: 1, limit: 12 },
    { skip: !userId },
  );

  const liveStream = channelStreams?.streams?.find(
    (stream: Stream) => stream.isLive,
  );

  const isFollowing =
    channelUser?.followers?.some(
      (id: string) => id.toString() === authUser?._id,
    ) ?? false;

  const handleFollow = async () => {
    setFollowError("");
    if (!userId) return;
    if (!authUser) {
      setFollowError("Bạn cần đăng nhập để follow kênh này.");
      return;
    }
    try {
      if (isFollowing) await unfollowUser(userId).unwrap();
      else await followUser(userId).unwrap();
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setFollowError(
        apiError.data?.message || "Không thể cập nhật trạng thái follow.",
      );
    }
  };

  const vodVideos =
    videosResult?.videos?.filter((v: Video) => v.type === "vod") || [];
  const clipVideos =
    videosResult?.videos?.filter((v: Video) => v.type === "clip" || !v.type) ||
    [];

  if (isLoading) return <div className="channel__loading">Loading...</div>;
  if (!channelUser)
    return <div className="channel__loading">Channel không tồn tại</div>;

  return (
    <div className="channel">
      <ChannelHeader
        channelUser={channelUser}
        liveStream={liveStream}
        isOwnChannel={userId === authUser?._id}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        followLoading={isFollowingUser || isUnfollowingUser}
        vodCount={vodVideos.length}
        clipCount={clipVideos.length}
      />

      {followError && (
        <p className="channel__error" role="alert">
          {followError}
        </p>
      )}

      <div
        className="channel__tabs"
        role="tablist"
        aria-label="Channel sections"
      >
        {(["VODs", "Clips", "Schedule", "About"] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`channel__tab ${activeTab === tab ? "channel__tab--active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="channel__content">
        {activeTab === "VODs" && (
          <VideoGrid
            videos={vodVideos}
            emptyIcon="📹"
            emptyText="Chưa có VOD nào"
          />
        )}
        {activeTab === "Clips" && (
          <VideoGrid
            videos={clipVideos}
            emptyIcon="🎬"
            emptyText="Chưa có Clip nào"
          />
        )}
        {activeTab === "Schedule" && (
          <ScheduleTab scheduledStreams={scheduledStreams} />
        )}
        {activeTab === "About" && (
          <AboutTab
            bio={channelUser.bio}
            followersCount={channelUser.followersCount}
            followingCount={channelUser.followingCount}
            vodCount={vodVideos.length}
            clipCount={clipVideos.length}
          />
        )}
      </div>
    </div>
  );
};

export default Channel;
