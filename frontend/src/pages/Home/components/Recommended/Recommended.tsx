import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetVideosQuery } from "../../../../store/api/videoApi";
import type { Video } from "../../../../types/index";
import { formatViewers, generateColor } from "../../../../utils/format";
import "./Recommended.css";

const formatDaysAgo = (dateString: string) => {
  const timestamp = new Date(dateString).getTime();
  if (!Number.isFinite(timestamp)) return "Không rõ thời gian";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
};

const Recommended = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetVideosQuery({
    page: 1,
    limit: 12,
  });
  const recommended = [...(data?.videos ?? [])]
    .sort((first: Video, second: Video) => second.views - first.views)
    .slice(0, 8);

  if (isLoading) {
    return (
      <section className="recommended" aria-labelledby="recommended-heading">
        <div className="recommended__header">
          <h2 id="recommended-heading" className="recommended__title">
            Đề xuất cho bạn
          </h2>
        </div>
        <div className="recommended__state" role="status">
          Đang tải video…
        </div>
      </section>
    );
  }

  if (isError || recommended.length === 0) {
    return (
      <section className="recommended" aria-labelledby="recommended-heading">
        <div className="recommended__header">
          <h2 id="recommended-heading" className="recommended__title">
            Đề xuất cho bạn
          </h2>
        </div>
        <div
          className="recommended__state"
          role={isError ? "alert" : undefined}
        >
          <strong>
            {isError ? "Không tải được video." : "Chưa có VOD công khai."}
          </strong>
          <span>
            {isError
              ? "Kiểm tra kết nối rồi thử lại."
              : "Video mới sẽ xuất hiện tại đây sau khi được upload."}
          </span>
          {isError && (
            <button type="button" onClick={() => void refetch()}>
              Thử lại
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="recommended" aria-labelledby="recommended-heading">
      <div className="recommended__header">
        <h2 id="recommended-heading" className="recommended__title">
          Đề xuất cho bạn
        </h2>
        <button
          type="button"
          className="recommended__more"
          onClick={() => navigate("/search")}
        >
          Xem tất cả
        </button>
      </div>

      <div className="recommended__list">
        {recommended.map((video: Video) => {
          const uploader =
            typeof video.userId === "object" ? video.userId : null;
          const uploaderName =
            uploader?.displayName || uploader?.username || "Người dùng";

          return (
            <button
              type="button"
              className="rec-card"
              key={video._id}
              onClick={() => navigate(`/video/${video._id}`)}
              aria-label={`Xem video ${video.title} của ${uploaderName}`}
            >
              <span className="rec-card__thumb">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <Play size={18} aria-hidden="true" />
                )}
              </span>

              <span className="rec-card__info">
                <span className="rec-card__title">{video.title}</span>
                <span className="rec-card__streamer">
                  <span
                    className="rec-card__avatar"
                    style={{ background: generateColor(uploaderName) }}
                  >
                    {uploader?.avatar ? (
                      <img src={uploader.avatar} alt="" loading="lazy" />
                    ) : (
                      uploaderName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span>{uploaderName}</span>
                </span>
                <span className="rec-card__meta">
                  {formatViewers(video.views)} lượt xem ·{" "}
                  {formatDaysAgo(video.createdAt)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Recommended;
