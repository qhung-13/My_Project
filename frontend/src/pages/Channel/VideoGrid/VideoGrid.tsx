import { useNavigate } from "react-router-dom";
import { formatViewers } from "../../../utils/format";
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
        <span>{emptyIcon}</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="channel__grid">
      {videos.map((video) => (
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
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
  );
};

export default VideoGrid;
