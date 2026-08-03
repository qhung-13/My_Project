import { MoreHorizontal } from "lucide-react";
import { generateColor } from "../../../utils/format";
import type { Stream } from "../../../types/index";

interface StreamInfoBarProps {
  stream: Stream;
  streamerId: string | undefined;
  streamerName: string;
  streamerAvatar: string | null | undefined;
  isOwnStream: boolean;
  isFollowing: boolean;
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
  onFollow,
  onDonate,
  onShare,
  onEdit,
  onAvatarClick,
}: StreamInfoBarProps) => {
  return (
    <div className="watch-live__info">
      <div className="info-header">
        <div
          className="info-avatar"
          style={{ background: generateColor(streamerName) }}
          onClick={onAvatarClick}
        >
          {streamerAvatar ? (
            <img
              src={streamerAvatar}
              alt={streamerName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            streamerName.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="info-details">
          <h2 className="info-title">{stream.title}</h2>
          <p className="info-meta">
            <span className="live-dot" />
            {streamerName} · {stream.category}
          </p>
        </div>
      </div>
      <div className="info-actions">
        {!isOwnStream && (
          <button className="btn-follow" onClick={onFollow}>
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {!isOwnStream && (
          <button className="btn-donate" onClick={onDonate}>
            Donate
          </button>
        )}
        <button className="btn-share" onClick={onShare}>
          Share
        </button>
        <button className="btn-more">
          <MoreHorizontal size={18} />
        </button>
        {isOwnStream && (
          <button className="btn-share" onClick={onEdit}>
            ✏️ Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default StreamInfoBar;
