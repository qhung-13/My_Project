import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearchVideosQuery } from "../../store/api/videoApi";
import { useGetLiveStreamsQuery } from "../../store/api/streamApi";
import {
  formatDuration,
  formatViewers,
  generateColor,
} from "../../utils/format";
import { Play } from "lucide-react";
import type { Video, Stream } from "../../types/index";
import { getStreamUser } from "../../utils/streamUser";
import "./Search.css";

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
  const q = (searchParams.get("q") || "").trim();
  const hasQuery = q.length > 0;

  const relatedCategories = ALL_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(q.toLowerCase()),
  );

  const { data: streamsResult, isError: isStreamsError } =
    useGetLiveStreamsQuery({ page: 1, limit: 50 }, { skip: !hasQuery });
  const relatedStreams = (streamsResult?.streams || [])
    .filter(
      (stream: Stream) =>
        stream.title?.toLowerCase().includes(q.toLowerCase()) ||
        stream.category?.toLowerCase().includes(q.toLowerCase()) ||
        (getStreamUser(stream.userId)
          ?.username?.toLowerCase()
          .includes(q.toLowerCase()) ??
          false),
    )
    .slice(0, 6);

  const {
    data: videosResult,
    isLoading,
    isError: isVideosError,
  } = useSearchVideosQuery({ q }, { skip: !hasQuery });
  const videos = videosResult?.videos || [];

  if (!hasQuery) {
    return (
      <div className="search-page">
        <section className="search-empty" aria-labelledby="search-empty-title">
          <h2 id="search-empty-title">Tìm nội dung trên OmexLive</h2>
          <p>Nhập tên video, livestream hoặc trò chơi trong thanh tìm kiếm.</p>
        </section>
      </div>
    );
  }

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
              <button
                type="button"
                key={cat}
                className="search-category-card"
                onClick={() =>
                  navigate(
                    `/search?${new URLSearchParams({ q: cat }).toString()}`,
                  )
                }
              >
                <span className="search-category-card__name">{cat}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2: Streams ── */}
      {relatedStreams.length > 0 && (
        <section className="search-section">
          <h3 className="search-section__title">Streams đang live</h3>
          <div className="search-streams">
            {relatedStreams.map((stream: Stream) => {
              const streamUser = getStreamUser(stream.userId);
              const name =
                streamUser?.displayName || streamUser?.username || "Unknown";
              return (
                <button
                  type="button"
                  key={stream._id}
                  className="search-stream-card"
                  onClick={() => navigate(`/stream/${stream._id}`)}
                >
                  <div
                    className="search-stream-card__thumb"
                    style={{ background: "#0a1a2e" }}
                  >
                    {stream.thumbnailUrl && (
                      <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <span className="search-stream-card__live">LIVE</span>
                    <span className="search-stream-card__viewers">
                      {formatViewers(stream.viewers)}
                    </span>
                    <Play size={20} fill="white" />
                  </div>
                  <div className="search-stream-card__info">
                    <div
                      className="search-stream-card__avatar"
                      style={{ background: generateColor(name || "") }}
                    >
                      {streamUser?.avatar ? (
                        <img
                          src={streamUser.avatar}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="search-stream-card__title">
                        {stream.title}
                      </p>
                      <p className="search-stream-card__meta">
                        {name} · {stream.category}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {isStreamsError && (
        <div className="search-empty" role="alert">
          <p>Không thể tải kết quả livestream.</p>
        </div>
      )}

      {/* ── Section 3: Videos ── */}
      <section className="search-section">
        <h3 className="search-section__title">Videos</h3>
        {isLoading ? (
          <div className="search-loading">Loading...</div>
        ) : videos.length > 0 ? (
          <div className="search-videos">
            {videos.map((video: Video) => (
              <button
                type="button"
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
                    {formatDuration(video.duration)}
                  </span>
                </div>
                <div className="search-video-card__info">
                  <p className="search-video-card__title">{video.title}</p>
                  <p className="search-video-card__meta">
                    {formatViewers(video.views)} lượt xem · {video.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : isVideosError ? (
          <div className="search-empty" role="alert">
            <p>Không thể tải kết quả video. Vui lòng thử lại.</p>
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
