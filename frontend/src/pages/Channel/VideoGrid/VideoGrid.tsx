import { useNavigate } from "react-router-dom";
import { formatDuration, formatViewers } from "../../../utils/format";
import type { Video } from "../../../types/index";

interface VideoGridProps {
  videos: Video[];
  emptyIcon: string;
  emptyText: string;
}

const VideoGrid = ({ videos, emptyIcon, emptyText }: VideoGridProps) => {
  const navigate = useNavigate();

  if (videos.length === 0) {
    return (
      <div className="channel__empty">
        <span aria-hidden="true">{emptyIcon}</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="channel__grid">
      {videos.map((video) => (
        <button
          key={video._id}
          type="button"
          className="channel__video-card"
          onClick={() => navigate(`/video/${video._id}`)}
        >
          <span className="channel__video-thumb">
            {video.thumbnailUrl ? (
              <img src={video.thumbnailUrl} alt="" />
            ) : (
              <span className="channel__video-placeholder">
                {video.category}
              </span>
            )}
            <span className="channel__video-duration">
              {formatDuration(video.duration)}
            </span>
          </span>
          <span className="channel__video-info">
            <span className="channel__video-title">{video.title}</span>
            <span className="channel__video-meta">
              {formatViewers(video.views)} views
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default VideoGrid;
