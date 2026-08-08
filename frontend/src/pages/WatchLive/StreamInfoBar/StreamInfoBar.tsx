import { generateColor } from "../../../utils/format";
import type { Stream } from "../../../types/index";

interface StreamInfoBarProps {
  stream: Stream;
  streamerName: string;
  streamerAvatar: string | null | undefined;
  isOwnStream: boolean;
  isFollowing: boolean;
  isFollowPending: boolean;
  actionMessage: string;
  onFollow: () => void;
  onDonate: () => void;
  onShare: () => void;
  onEdit: () => void;
  onAvatarClick: () => void;
}

const StreamInfoBar = ({
  stream,
  streamerName,
  streamerAvatar,
  isOwnStream,
  isFollowing,
  isFollowPending,
  actionMessage,
  onFollow,
  onDonate,
  onShare,
  onEdit,
  onAvatarClick,
}: StreamInfoBarProps) => (
  <section className="watch-live__info" aria-labelledby="live-stream-title">
    <div className="info-header">
      <button
        type="button"
        className="info-avatar"
        style={{ background: generateColor(streamerName) }}
        onClick={onAvatarClick}
        aria-label={`Xem hồ sơ ${streamerName}`}
      >
        {streamerAvatar ? (
          <img src={streamerAvatar} alt="" />
        ) : (
          streamerName.slice(0, 2).toUpperCase()
        )}
      </button>
      <div className="info-details">
        <h1 id="live-stream-title" className="info-title">
          {stream.title}
        </h1>
        <p className="info-meta">
          <span className="live-dot" aria-hidden="true" />
          {streamerName} · {stream.category}
        </p>
        {actionMessage && (
          <p className="info-message" role="status">
            {actionMessage}
          </p>
        )}
      </div>
    </div>
    <div className="info-actions">
      {!isOwnStream && (
        <button
          type="button"
          className="btn-follow"
          onClick={onFollow}
          disabled={isFollowPending}
        >
          {isFollowPending
            ? "Đang xử lý..."
            : isFollowing
              ? "Đang theo dõi"
              : "Theo dõi"}
        </button>
      )}
      {!isOwnStream && (
        <button type="button" className="btn-donate" onClick={onDonate}>
          Donate
        </button>
      )}
      <button type="button" className="btn-share" onClick={onShare}>
        Chia sẻ
      </button>
      {isOwnStream && (
        <button type="button" className="btn-share" onClick={onEdit}>
          Chỉnh sửa
        </button>
      )}
    </div>
  </section>
);

export default StreamInfoBar;
