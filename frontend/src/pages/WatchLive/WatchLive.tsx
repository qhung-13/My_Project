import { useEffect, useState } from "react";
import { formatViewers } from "../../utils/format";
import "./WatchLive.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { Stream } from "../../types/index";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserByIdQuery,
} from "../../store/api/userApi";
import { useGetStreamByIdQuery, useGetLiveStreamsQuery } from "../../store/api/streamApi";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import DonateModal from "./DonateModal/DonateModal";
import UpdateStreamModal from "../../components/UpdateStreamModal/UpdateStreamModal";
import ViewerList from "../../components/ViewerList/ViewerList";
import ChatPanel from "./ChatPanel/ChatPanel";
import StreamInfoBar from "./StreamInfoBar/StreamInfoBar";
import SuggestedStreams from "./SuggestedStreams/SuggestedStreams";
import DonationAlerts from "./DonationAlerts/DonationAlerts";
import ReactionBar from "./ReactionBar/ReactionBar";
import useLiveStreamSocket from "./hooks/useLiveStreamSocket";
import useStreamModeration from "./hooks/useStreamModeration";

// ============================================================
// WatchLive — page-level orchestrator only.
//
// All realtime plumbing lives in ./hooks/useLiveStreamSocket, moderation
// actions live in ./hooks/useStreamModeration, and every visual section
// (chat, info bar, suggested streams, donation toasts, reactions) is its
// own component under this folder. This file's only job is to fetch the
// stream, wire the pieces together, and render layout.
// ============================================================
const WatchLive = () => {
  const { streamerId: id } = useParams<{ streamerId: string }>();
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewerList, setShowViewerList] = useState(false);

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const { data: currentStream, isLoading: isStreamLoading } =
    useGetStreamByIdQuery(id!, { skip: !id }) as {
      data: Stream | undefined;
      isLoading: boolean;
    };

  const { data: result } = useGetLiveStreamsQuery(undefined);

  const {
    messages,
    viewerCount,
    viewers,
    donationAlerts,
    reactions,
    isBlocked,
    blockMessage,
    sendMessage,
    sendReaction,
  } = useLiveStreamSocket(id, authUser);

  const {
    selectedUser,
    selectUser,
    clearSelectedUser,
    handleTimeout,
    handleBan,
  } = useStreamModeration(id);

  // Remounting on navigation between streams is handled by giving this
  // component a `key={streamerId}` at the route level (see App.tsx), so we
  // only need to handle scroll position here — no manual state resets.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const streamerId =
    typeof currentStream?.userId === "object"
      ? currentStream.userId._id
      : currentStream?.userId;

  const { data: streamerData } = useGetUserByIdQuery(streamerId!, {
    skip: !streamerId,
  });

  const isFollowing =
    streamerData?.followers?.some(
      (followerId: string) => followerId.toString() === authUser?._id,
    ) ?? false;

  const handleFollow = async () => {
    if (!streamerId) return;
    try {
      if (isFollowing) await unfollowUser(streamerId).unwrap();
      else await followUser(streamerId).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputMessage);
    setInputMessage("");
  };

  const suggestedStreams = (result?.streams || [])
    .filter((stream: Stream) => stream._id !== id)
    .slice(0, 10);

  if (isStreamLoading) {
    return <div className="watch-live__loading">Loading...</div>;
  }

  if (!currentStream) {
    return (
      <div className="watch-live__loading">
        Stream không tồn tại hoặc đã kết thúc
      </div>
    );
  }

  const streamerName =
    typeof currentStream.userId === "object"
      ? currentStream.userId.displayName || currentStream.userId.username
      : "Unknown";

  const streamerAvatar =
    typeof currentStream.userId === "object"
      ? currentStream.userId.avatar
      : null;

  const isOwnStream = streamerId === authUser?._id;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: currentStream.title,
        text: `Đang xem ${streamerName} live trên OmexLive!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Đã copy link stream!");
    }
  };

  return (
    <div className="watch-live">
      {/* ── Video ── */}
      <div className="watch-live__video">
        <div className="video-badges">
          <span className="badge-live">LIVE</span>
          <span
            className="badge-viewers"
            style={{ cursor: "pointer" }}
            onClick={() => setShowViewerList(true)}
          >
            {formatViewers(viewerCount)} 👥
          </span>
        </div>
        <VideoPlayer streamKey={currentStream.streamKey || ""} />
        <ViewerList
          viewers={viewers}
          isOpen={showViewerList}
          onClose={() => setShowViewerList(false)}
        />
      </div>

      <StreamInfoBar
        stream={currentStream}
        streamerId={streamerId}
        streamerName={streamerName}
        streamerAvatar={streamerAvatar}
        isOwnStream={isOwnStream}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onDonate={() => setIsDonateModalOpen(true)}
        onShare={handleShare}
        onEdit={() => setShowUpdateModal(true)}
        onAvatarClick={() => streamerId && navigate(`/profile/${streamerId}`)}
      />

      {/* ── Chat + Suggested ── */}
      <div className="watch-live__interactive">
        <ChatPanel
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen((prev) => !prev)}
          messages={messages}
          inputMessage={inputMessage}
          onInputChange={setInputMessage}
          onSend={handleSendMessage}
          isStreamer={isOwnStream}
          currentUserId={authUser?._id}
          selectedUser={selectedUser}
          onSelectUser={selectUser}
          onClearSelectedUser={clearSelectedUser}
          onTimeout={handleTimeout}
          onBan={handleBan}
          isBlocked={isBlocked}
          blockMessage={blockMessage}
        />

        <SuggestedStreams
          streams={suggestedStreams}
          hideOnMobile={isChatOpen}
        />
      </div>

      <DonationAlerts alerts={donationAlerts} />

      <ReactionBar onReact={sendReaction} floatingReactions={reactions} />

      {isDonateModalOpen && streamerId && (
        <DonateModal
          streamerId={streamerId}
          streamerName={streamerName}
          onClose={() => setIsDonateModalOpen(false)}
        />
      )}

      {showUpdateModal && currentStream && (
        <UpdateStreamModal
          currentStream={currentStream}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};

export default WatchLive;
