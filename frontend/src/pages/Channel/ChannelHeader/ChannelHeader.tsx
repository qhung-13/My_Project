import { useNavigate } from "react-router-dom";
import { generateColor } from "../../../utils/format";
import type { Stream, StreamUser } from "../../../types/index";

interface ChannelHeaderProps {
  channelUser: StreamUser & {
    bannerImage?: string | null;
    bio?: string;
    followersCount?: number;
  };
  liveStream: Stream | undefined;
  isOwnChannel: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  vodCount: number;
  clipCount: number;
}

const ChannelHeader = ({
  channelUser,
  liveStream,
  isOwnChannel,
  isFollowing,
  onFollow,
  vodCount,
  clipCount,
}: ChannelHeaderProps) => {
  const navigate = useNavigate();
  const displayName =
    channelUser.displayName || channelUser.username || "Unknown";
  const avatar = channelUser.avatar;

  return (
    <>
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
            <span>{vodCount} VODs</span>
            <span>·</span>
            <span>{clipCount} Clips</span>
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
          {!isOwnChannel && (
            <button
              className={`channel__follow-btn ${isFollowing ? "channel__follow-btn--following" : ""}`}
              onClick={onFollow}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
          {isOwnChannel && (
            <button
              className="channel__edit-btn"
              onClick={() => navigate("/profile/me")}
            >
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ChannelHeader;
