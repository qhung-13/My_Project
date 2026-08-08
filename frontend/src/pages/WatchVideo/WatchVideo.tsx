import { MessageSquare, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { Comment, Video } from "../../types/index";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useDislikeVideoMutation,
  useGetCommentsQuery,
  useGetVideoByIdQuery,
  useGetVideosQuery,
  useIncreaseViewMutation,
  useLikeVideoMutation,
  useUndislikeVideoMutation,
  useUnlikeVideoMutation,
} from "../../store/api/videoApi";
import {
  useFollowUserMutation,
  useGetUserByIdQuery,
  useUnfollowUserMutation,
} from "../../store/api/userApi";
import ClipCreator from "../../components/ClipCreator/ClipCreator";
import "./WatchVideo.css";

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const getApiError = (error: unknown, fallback: string) => {
  const apiError = error as { data?: { message?: string } };
  return apiError.data?.message || fallback;
};

const WatchVideo = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const hasViewed = useRef(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showClipCreator, setShowClipCreator] = useState(false);
  const [actionError, setActionError] = useState("");

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const {
    data: video,
    isLoading,
    isError,
  } = useGetVideoByIdQuery(videoId!, { skip: !videoId }) as {
    data: Video | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  const { data: result } = useGetVideosQuery(undefined);
  const {
    data: comments = [],
    isLoading: areCommentsLoading,
    isError: commentsError,
  } = useGetCommentsQuery(videoId!, { skip: !videoId }) as {
    data: Comment[] | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const uploaderId =
    typeof video?.userId === "object" ? video.userId._id : video?.userId;
  const uploaderPopulated =
    typeof video?.userId === "object" ? video.userId : null;
  const { data: uploaderData } = useGetUserByIdQuery(uploaderId!, {
    skip: !uploaderId,
  });

  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] =
    useUnfollowUserMutation();
  const [likeVideo, { isLoading: isLiking }] = useLikeVideoMutation();
  const [unlikeVideo, { isLoading: isUnliking }] = useUnlikeVideoMutation();
  const [dislikeVideo, { isLoading: isDisliking }] = useDislikeVideoMutation();
  const [undislikeVideo, { isLoading: isUndisliking }] =
    useUndislikeVideoMutation();
  const [createComment, { isLoading: isCreatingComment }] =
    useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [increaseView] = useIncreaseViewMutation();

  useEffect(() => {
    window.scrollTo(0, 0);
    hasViewed.current = false;
    setActionError("");
    setCommentText("");
  }, [videoId]);

  useEffect(() => {
    if (!videoId || !video || hasViewed.current) return;
    hasViewed.current = true;
    void increaseView(videoId)
      .unwrap()
      .catch(() => {
        // View tracking must never block video playback.
      });
  }, [videoId, video, increaseView]);

  const uploaderName =
    uploaderPopulated?.displayName ||
    uploaderPopulated?.username ||
    uploaderData?.displayName ||
    uploaderData?.username ||
    "Unknown";
  const isOwnVideo = uploaderId === authUser?._id;
  const isFollowingUploader =
    uploaderData?.followers?.some(
      (id: string) => id.toString() === authUser?._id,
    ) ?? false;
  const isLiked =
    video?.likes?.some((id: string) => id.toString() === authUser?._id) ??
    false;
  const isDisliked =
    video?.dislikes?.some((id: string) => id.toString() === authUser?._id) ??
    false;

  const requireAuthentication = () => {
    if (authUser) return true;
    setActionError("Bạn cần đăng nhập để thực hiện thao tác này.");
    return false;
  };

  const handleFollow = async () => {
    if (!uploaderId || isOwnVideo || !requireAuthentication()) return;
    setActionError("");
    try {
      if (isFollowingUploader) await unfollowUser(uploaderId).unwrap();
      else await followUser(uploaderId).unwrap();
    } catch (error) {
      setActionError(
        getApiError(error, "Không thể cập nhật trạng thái theo dõi."),
      );
    }
  };

  const handleLike = async () => {
    if (!videoId || !requireAuthentication()) return;
    setActionError("");
    try {
      if (isLiked) await unlikeVideo(videoId).unwrap();
      else await likeVideo(videoId).unwrap();
    } catch (error) {
      setActionError(getApiError(error, "Không thể cập nhật lượt thích."));
    }
  };

  const handleDislike = async () => {
    if (!videoId || !requireAuthentication()) return;
    setActionError("");
    try {
      if (isDisliked) await undislikeVideo(videoId).unwrap();
      else await dislikeVideo(videoId).unwrap();
    } catch (error) {
      setActionError(
        getApiError(error, "Không thể cập nhật lượt không thích."),
      );
    }
  };

  const handleComment = async () => {
    const content = commentText.trim();
    if (!videoId || !content || !requireAuthentication()) return;
    setActionError("");
    try {
      await createComment({ videoId, content }).unwrap();
      setCommentText("");
    } catch (error) {
      setActionError(getApiError(error, "Không thể đăng bình luận."));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setActionError("");
    try {
      await deleteComment(commentId).unwrap();
    } catch (error) {
      setActionError(getApiError(error, "Không thể xóa bình luận."));
    }
  };

  const suggestedVideos =
    result?.videos
      ?.filter((item: Video) => item._id !== videoId)
      .slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="watch-video__loading" role="status">
        Đang tải...
      </div>
    );
  }
  if (isError || !video) {
    return (
      <div className="watch-video__loading" role="alert">
        Video không tồn tại hoặc không còn công khai.
      </div>
    );
  }

  return (
    <div className="watch-live">
      <div className="watch-live__video">
        <video
          src={video.videoUrl}
          poster={video.thumbnailUrl || undefined}
          controls
          playsInline
          preload="metadata"
          aria-label={`Video: ${video.title}`}
          className="watch-video__player"
        />
      </div>

      <div className="watch-live__info">
        <div className="info-header">
          <button
            type="button"
            className="info-avatar watch-video__avatar-button"
            onClick={() => uploaderId && navigate(`/channel/${uploaderId}`)}
            disabled={!uploaderId}
            aria-label={`Mở kênh của ${uploaderName}`}
          >
            {uploaderData?.avatar ? (
              <img src={uploaderData.avatar} alt="" loading="lazy" />
            ) : (
              uploaderName.slice(0, 2).toUpperCase()
            )}
          </button>
          <div className="info-details">
            <h1 className="info-title">{video.title}</h1>
            <p className="info-meta">
              {uploaderName} · {video.category} · {video.views.toLocaleString()}{" "}
              lượt xem
            </p>
          </div>
        </div>

        {actionError && (
          <p className="watch-video__action-error" role="alert">
            {actionError}
          </p>
        )}

        <div className="info-actions">
          <button
            type="button"
            className="btn-follow"
            onClick={handleFollow}
            disabled={isOwnVideo || isFollowing || isUnfollowing}
            title={isOwnVideo ? "Bạn không thể theo dõi chính mình" : undefined}
          >
            {isFollowingUploader ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            className={`btn-follow ${isLiked ? "btn-follow--active" : ""}`}
            onClick={handleLike}
            disabled={isLiking || isUnliking}
            aria-pressed={isLiked}
          >
            <ThumbsUp size={16} aria-hidden="true" />
            {video.likesCount}
          </button>
          <button
            type="button"
            className={`btn-follow ${isDisliked ? "btn-follow--active" : ""}`}
            onClick={handleDislike}
            disabled={isDisliking || isUndisliking}
            aria-pressed={isDisliked}
          >
            <ThumbsDown size={16} aria-hidden="true" />
            {video.dislikesCount}
          </button>
          <button
            type="button"
            className="btn-follow"
            onClick={() => {
              if (requireAuthentication()) setShowClipCreator(true);
            }}
          >
            ✂️ Clip
          </button>
        </div>
      </div>

      <div className="watch-live__interactive">
        <section
          className={`chat-panel ${isCommentOpen ? "chat-panel--open" : ""}`}
        >
          <button
            type="button"
            className="chat-panel__tab"
            onClick={() => setIsCommentOpen((current) => !current)}
            aria-expanded={isCommentOpen}
          >
            <span className="chat-panel__tab-left">
              <MessageSquare size={14} aria-hidden="true" />
              <span>Bình luận ({comments.length})</span>
              {!isCommentOpen && (
                <span className="chat-panel__hint">
                  · Hãy để lại bình luận!
                </span>
              )}
            </span>
            <span
              className={`chat-panel__arrow ${isCommentOpen ? "chat-panel__arrow--up" : ""}`}
              aria-hidden="true"
            >
              ↑
            </span>
          </button>

          <div className="chat-panel__content">
            <div className="chat-panel__messages" aria-live="polite">
              {areCommentsLoading ? (
                <p className="watch-video__comment-state">
                  Đang tải bình luận...
                </p>
              ) : commentsError ? (
                <p className="watch-video__comment-state" role="alert">
                  Không thể tải bình luận.
                </p>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <article className="chat-msg" key={comment._id}>
                    <div className="chat-msg__avatar">
                      {comment.userId?.avatar ? (
                        <img
                          src={comment.userId.avatar}
                          alt=""
                          loading="lazy"
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
                    <div className="chat-msg__body">
                      <span className="chat-msg__user">
                        {comment.userId?.displayName ||
                          comment.userId?.username ||
                          "Người dùng"}
                      </span>
                      <span className="chat-msg__text"> {comment.content}</span>
                      {(authUser?._id === comment.userId?._id ||
                        authUser?.role === "admin") && (
                        <button
                          type="button"
                          className="watch-video__delete-comment"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="watch-video__comment-state">
                  Chưa có bình luận nào.
                </p>
              )}
            </div>

            {authUser ? (
              <form
                className="chat-panel__input"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleComment();
                }}
              >
                <label className="sr-only" htmlFor="video-comment">
                  Viết bình luận
                </label>
                <input
                  id="video-comment"
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="chat-panel__send"
                  disabled={!commentText.trim() || isCreatingComment}
                  aria-label="Gửi bình luận"
                >
                  <Send size={14} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <p className="watch-video__comment-state">
                Đăng nhập để bình luận.
              </p>
            )}
          </div>
        </section>

        <section
          className={`suggested ${isCommentOpen ? "suggested--hidden-mobile" : ""}`}
        >
          <h2 className="suggested__title">Video khác</h2>
          <div className="suggested__list">
            {suggestedVideos.map((item: Video) => (
              <button
                type="button"
                className="suggested-card"
                key={item._id}
                onClick={() => navigate(`/video/${item._id}`)}
              >
                <div className="suggested-card__thumb">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span>{item.category}</span>
                  )}
                  <span className="suggested-card__duration">
                    {formatDuration(item.duration)}
                  </span>
                </div>
                <div className="suggested-card__info">
                  <span className="suggested-card__title">{item.title}</span>
                  <span className="suggested-card__streamer">
                    {typeof item.userId === "object"
                      ? item.userId.displayName || item.userId.username
                      : "Unknown"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
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
