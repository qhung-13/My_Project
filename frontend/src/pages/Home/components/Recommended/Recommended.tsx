import { Play } from "lucide-react";
import { formatViewers, generateColor } from "../../../../utils/format";
import { useNavigate } from "react-router-dom";
import { useGetVideosQuery } from "../../../../store/api/videoApi";
import type { Video } from "../../../../types/index";
import "./Recommended.css";

const formatDaysAgo = (dateStr: string) => {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Yesterday";
  }
  return `${days} ago`;
};

const Recommended = () => {
  const navigate = useNavigate();
  const { data: videos, isLoading } = useGetVideosQuery(undefined);

  const recommended = videos
    ? [...videos].sort((a: Video, b: Video) => b.views - a.views).slice(0, 8)
    : [];

  if (isLoading) {
    return null;
  }

  if (!recommended.length) {
    return null;
  }

  return (
    <div className="recommended">
      {/* Header */}
      <div className="recommended__header">
        <span className="recommended__title">Recommended</span>
        <button
          className="recommended__more"
          onClick={() => navigate("/search")}
        >
          Xem tất cả
        </button>
      </div>

      {/* List dọc */}
      <div className="recommended__list">
        {recommended.map((video: Video) => {
          const uploader =
            typeof video.userId === "object" ? video.userId : null;
          const uploaderName =
            uploader?.displayName || uploader?.username || "Unknow";

          return (
            <div
              className="rec-card"
              key={video._id}
              onClick={() => navigate(`/video${video._id}`)}
            >
              <div
                className="rec-card__thumb"
                style={{ background: "#0a1a2e" }}
              >
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
                  <Play size={16} color="rgba(255,255,255,0.6)" />
                )}
              </div>

              <div className="rec-card__info">
                <div className="rec_card__title">{video.title}</div>
                <div className="rec_card__streamer">
                  <div
                    className="rec_card__avatar"
                    style={{ background: generateColor(uploaderName) }}
                  >
                    {uploader?.avatar ? (
                      <img
                        src={uploader.avatar}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      uploaderName.slice(0, 2).toLocaleUpperCase()
                    )}
                  </div>
                  <span>{uploaderName}</span>
                </div>
                <div className="rec-card__meta">
                  {formatViewers(video.views)} views .{" "}
                  {formatDaysAgo(video.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recommended;
