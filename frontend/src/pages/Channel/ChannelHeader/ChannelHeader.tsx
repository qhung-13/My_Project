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
  followLoading: boolean;
  vodCount: number;
  clipCount: number;
}

const ChannelHeader = ({
  channelUser,
  liveStream,
  isOwnChannel,
  isFollowing,
  onFollow,
  followLoading,
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
        style={
          channelUser.bannerImage
            ? { backgroundImage: `url(${channelUser.bannerImage})` }
            : {
                background: `linear-gradient(135deg, ${generateColor(displayName)}, #1a1a2e)`,
              }
        }
      >
        {liveStream && (
          <button
            type="button"
            className="channel__live-badge"
            onClick={() => navigate(`/stream/${liveStream._id}`)}
          >
            <span aria-hidden="true">●</span> ĐANG LIVE — {liveStream.title}
          </button>
        )}
      </div>

      <div className="channel__info">
        <div className="channel__avatar-wrap">
          <div
            className="channel__avatar"
            style={{ background: generateColor(displayName) }}
          >
            {avatar ? (
              <img src={avatar} alt={`${displayName} avatar`} />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
        </div>

        <div className="channel__meta">
          <div className="channel__name-row">
            <h1 className="channel__name">{displayName}</h1>
            {liveStream && <span className="channel__live-dot">LIVE</span>}
          </div>
          <div className="channel__stats">
            <span>{channelUser.followersCount ?? 0} followers</span>
            <span aria-hidden="true">·</span>
            <span>{vodCount} VODs</span>
            <span aria-hidden="true">·</span>
            <span>{clipCount} Clips</span>
          </div>
          <p className="channel__bio">{channelUser.bio || "Chưa có mô tả"}</p>
        </div>

        <div className="channel__actions">
          {liveStream && (
            <button
              type="button"
              className="channel__watch-btn"
              onClick={() => navigate(`/stream/${liveStream._id}`)}
            >
              Xem Live
            </button>
          )}
          {!isOwnChannel && (
            <button
              type="button"
              className={`channel__follow-btn ${isFollowing ? "channel__follow-btn--following" : ""}`}
              disabled={followLoading}
              aria-pressed={isFollowing}
              onClick={onFollow}
            >
              {followLoading
                ? "Đang cập nhật…"
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
          )}
          {isOwnChannel && (
            <button
              type="button"
              className="channel__edit-btn"
              onClick={() => navigate("/profile/me")}
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ChannelHeader;
