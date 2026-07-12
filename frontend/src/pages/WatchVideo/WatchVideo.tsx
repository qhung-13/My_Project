import {
  MessageSquare,
  MoreHorizontal,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { Video, Comment } from "../../types/index";
import {
  useGetVideoByIdQuery,
  useGetVideosQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useDislikeVideoMutation,
  useUndislikeVideoMutation,
  useIncreaseViewMutation,
} from "../../store/api/videoApi";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserByIdQuery,
} from "../../store/api/userApi";
import ClipCreator from "../../components/ClipCreator/ClipCreator";
import "./WatchVideo.css";

const WatchVideo = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showClipCreator, setShowClipCreator] = useState(false);
  const hasViewed = useRef(false);

  const { user: authUser } = useSelector((state: RootState) => state.auth);

  const { data: video, isLoading } = useGetVideoByIdQuery(videoId!, {
    skip: !videoId,
  }) as { data: Video | undefined; isLoading: boolean };
  const { data: result } = useGetVideosQuery(undefined);
  const { data: comments } = useGetCommentsQuery(videoId!, { skip: !videoId });

  const uploaderId =
    typeof video?.userId === "object" ? video?.userId?._id : video?.userId;
  const streamerId = uploaderId;
  const uploaderPopulated =
    typeof video?.userId === "object" ? video?.userId : null;

  const { data: uploaderData } = useGetUserByIdQuery(uploaderId!, {
    skip: !uploaderId,
  });

  const uploaderName =
    uploaderPopulated?.displayName ||
    uploaderPopulated?.username ||
    uploaderData?.displayName ||
    uploaderData?.username ||
    "Unknown";

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();
  const [likeVideo] = useLikeVideoMutation();
  const [unlikeVideo] = useUnlikeVideoMutation();
  const [createComment] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [dislikeVideo] = useDislikeVideoMutation();
  const [undislikeVideo] = useUndislikeVideoMutation();
  const [increaseView] = useIncreaseViewMutation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  useEffect(() => {
    hasViewed.current = false;
  }, [videoId]);

  useEffect(() => {
    if (videoId && !hasViewed.current) {
      hasViewed.current = true;
      increaseView(videoId);
    }
  }, [videoId, increaseView]);

  const isFollowing =
    uploaderData?.followers?.some(
      (id: string) => id.toString() === authUser?._id,
    ) ?? false;

  const isLiked =
    video?.likes?.some((id: string) => id.toString() === authUser?._id) ??
    false;

  const handleFollow = async () => {
    if (!uploaderId) return;
    try {
      if (isFollowing) await unfollowUser(uploaderId).unwrap();
      else await followUser(uploaderId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLike = async () => {
    if (!videoId) return;
    try {
      if (isLiked) await unlikeVideo(videoId).unwrap();
      else await likeVideo(videoId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !videoId) return;
    try {
      await createComment({ videoId, content: commentText }).unwrap();
      setCommentText("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const suggestedVideos =
    result?.videos?.filter((v: Video) => v._id !== videoId).slice(0, 10) || [];

  if (isLoading) return <div className="watch-video__loading">Loading...</div>;
  if (!video)
    return <div className="watch-video__loading">Video not found</div>;

  const isDisliked =
    video?.dislikes?.some((id: string) => id.toString() === authUser?._id) ??
    false;

  const handleDislike = async () => {
    if (!videoId) return;
    try {
      if (isDisliked) await undislikeVideo(videoId).unwrap();
      else await dislikeVideo(videoId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="watch-live">
      <div className="watch-live__video">
        <video
          src={video.videoUrl}
          controls
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <div className="watch-live__info">
        <div className="info-header">
          <div
            className="info-avatar"
            style={{ background: "#6366f1", cursor: "pointer" }}
            onClick={() => {
              if (streamerId) navigate(`/channel/${streamerId}`);
            }}
          >
            {uploaderData?.avatar ? (
              <img
                src={uploaderData.avatar}
                alt={uploaderName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              uploaderName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="info-details">
            <h2 className="info-title">{video.title}</h2>
            <p className="info-meta">
              {uploaderName} · {video.category} · {video.views} views
            </p>
          </div>
        </div>
        <div className="info-actions">
          {/* Follow */}
          <button
            className="btn-follow"
            onClick={handleFollow}
            disabled={uploaderId === authUser?._id}
            style={{
              opacity: uploaderId === authUser?._id ? 0.4 : 1,
              cursor: uploaderId === authUser?._id ? "not-allowed" : "pointer",
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>

          {/* Like */}
          <button
            className={`btn-follow ${isLiked ? "btn-follow--active" : ""}`}
            onClick={handleLike}
            disabled={uploaderId === authUser?._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: uploaderId === authUser?._id ? 0.4 : 1,
              cursor: uploaderId === authUser?._id ? "not-allowed" : "pointer",
            }}
          >
            <ThumbsUp size={16} />
            {video.likesCount}
          </button>

          {/* Dislike */}
          <button
            className={`btn-follow ${isDisliked ? "btn-follow--active" : ""}`}
            onClick={handleDislike}
            disabled={uploaderId === authUser?._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: uploaderId === authUser?._id ? 0.4 : 1,
              cursor: uploaderId === authUser?._id ? "not-allowed" : "pointer",
            }}
          >
            <ThumbsDown size={16} />
            {video.dislikesCount}
          </button>
          <button
            className="btn-follow"
            onClick={() => setShowClipCreator(true)}
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            ✂️ Clip
          </button>
          <button className="btn-more">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="watch-live__interactive">
        <div
          className={`chat-panel ${isCommentOpen ? "chat-panel--open" : ""}`}
        >
          <div
            className="chat-panel__tab"
            onClick={() => setIsCommentOpen(!isCommentOpen)}
          >
            <div className="chat-panel__tab-left">
              <MessageSquare size={14} />
              <span>Bình luận ({comments?.length || 0})</span>
              {!isCommentOpen && (
                <span className="chat-panel__hint">
                  · Hãy để lại bình luận!
                </span>
              )}
            </div>
            <span
              className={`chat-panel__arrow ${isCommentOpen ? "chat-panel__arrow--up" : ""}`}
            >
              ↑
            </span>
          </div>

          <div className="chat-panel__content">
            <div className="chat-panel__messages">
              {comments && comments.length > 0 ? (
                comments.map((comment: Comment) => (
                  <div className="chat-msg" key={comment._id}>
                    <div
                      className="chat-msg__avatar"
                      style={{ background: "#6366f1" }}
                    >
                      {comment.userId?.avatar ? (
                        <img
                          src={comment.userId.avatar}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                          }}
                        />
                      ) : (
                        (
                          comment.userId?.displayName ||
                          comment.userId?.username ||
                          "?"
                        )
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="chat-msg__user">
                        {comment.userId?.displayName ||
                          comment.userId?.username}
                      </span>
                      <span className="chat-msg__text"> {comment.content}</span>
                      {authUser?._id === comment.userId?._id && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          style={{
                            fontSize: "11px",
                            color: "#ef4444",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: "8px",
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "#999",
                    padding: "20px",
                  }}
                >
                  Chưa có bình luận nào
                </p>
              )}
            </div>

            {authUser && (
              <div className="chat-panel__input">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                />
                <button className="chat-panel__send" onClick={handleComment}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className={`suggested ${isCommentOpen ? "suggested--hidden-mobile" : ""}`}
        >
          <h3 className="suggested__title">Video khác</h3>
          <div className="suggested__list">
            {suggestedVideos.map((v: Video) => (
              <div
                className="suggested-card"
                key={v._id}
                onClick={() => navigate(`/video/${v._id}`)}
              >
                <div
                  className="suggested-card__thumb"
                  style={{ background: "#1a1a2e" }}
                >
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#fff",
                        fontSize: "12px",
                        padding: "4px",
                      }}
                    >
                      {v.category}
                    </span>
                  )}
                </div>
                <div className="suggested-card__info">
                  <div className="suggested-card__title">{v.title}</div>
                  <div className="suggested-card__streamer">
                    <span>
                      {typeof v.userId === "object"
                        ? v.userId?.username
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showClipCreator && (
        <ClipCreator
          videoId={video._id}
          videoDuration={video.duration}
          onClose={() => setShowClipCreator(false)}
        />
      )}
    </div>
  );
};

export default WatchVideo;
