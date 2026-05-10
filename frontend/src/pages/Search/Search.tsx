import { useSearchParams } from "react-router-dom";
import { useSearchVideosQuery } from "../../store/api/videoApi";
import { useNavigate } from "react-router-dom";
import { STREAMS } from "../../data/stream";
import { formatViewers } from "../../utils/format";
import { Play } from "lucide-react";
import type { Video } from "../../types/index";
import "./Search.css";

// Categories có sẵn
const ALL_CATEGORIES = [
  "LOL",
  "PUBG",
  "CS2",
  "Valorant",
  "Dota 2",
  "FIFA",
  "MLBB",
  "COD",
];

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") || "";

  // Filter categories liên quan
  const relatedCategories = ALL_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(q.toLowerCase()),
  );

  // Filter streams liên quan
  const relatedStreams = STREAMS.filter(
    (stream) =>
      stream.streamerName.toLowerCase().includes(q.toLowerCase()) ||
      stream.game.toLowerCase().includes(q.toLowerCase()) ||
      stream.streamTitle.toLowerCase().includes(q.toLowerCase()),
  ).slice(0, 6);

  // Fetch videos liên quan từ API
  const { data: videos, isLoading } = useSearchVideosQuery({ q });

  return (
    <div className="search-page">
      <h2 className="search-page__title">
        Kết quả tìm kiếm cho: <span>"{q}"</span>
      </h2>

      {/* ── Section 1: Categories ── */}
      {relatedCategories.length > 0 && (
        <section className="search-section">
          <h3 className="search-section__title">Categories</h3>
          <div className="search-categories">
            {relatedCategories.map((cat) => (
              <div
                key={cat}
                className="search-category-card"
                onClick={() => navigate(`/search?q=${cat}`)}
              >
                <span className="search-category-card__name">{cat}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2: Streams ── */}
      {relatedStreams.length > 0 && (
        <section className="search-section">
          <h3 className="search-section__title">Streams đang live</h3>
          <div className="search-streams">
            {relatedStreams.map((stream) => (
              <div
                key={stream.id}
                className="search-stream-card"
                onClick={() => navigate(`/stream/${stream.id}`)}
              >
                <div
                  className="search-stream-card__thumb"
                  style={{ background: stream.bg }}
                >
                  <span className="search-stream-card__live">LIVE</span>
                  <span className="search-stream-card__viewers">
                    {formatViewers(stream.viewers)}
                  </span>
                  <Play size={20} fill="white" />
                </div>
                <div className="search-stream-card__info">
                  <div
                    className="search-stream-card__avatar"
                    style={{ background: stream.avatarColor }}
                  >
                    {stream.initials}
                  </div>
                  <div>
                    <p className="search-stream-card__title">
                      {stream.streamTitle}
                    </p>
                    <p className="search-stream-card__meta">
                      {stream.streamerName} · {stream.game}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3: Videos ── */}
      <section className="search-section">
        <h3 className="search-section__title">Videos</h3>
        {isLoading ? (
          <div className="search-loading">Loading...</div>
        ) : videos && videos.length > 0 ? (
          <div className="search-videos">
            {videos.map((video: Video) => (
              <div
                key={video._id}
                className="search-video-card"
                onClick={() => navigate(`/video/${video._id}`)}
              >
                <div className="search-video-card__thumb">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} />
                  ) : (
                    <div className="search-video-card__thumb-placeholder">
                      {video.category}
                    </div>
                  )}
                  <span className="search-video-card__duration">
                    {video.duration}s
                  </span>
                </div>
                <div className="search-video-card__info">
                  <p className="search-video-card__title">{video.title}</p>
                  <p className="search-video-card__meta">
                    {video.views} views · {video.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="search-empty">
            <p>Không tìm thấy video nào cho "{q}"</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Search;
