import { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../utils/axios";

import "./UploadVideo.css";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let timeoutId: number | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("Could not read the video duration"));
        return;
      }
      resolve(Math.ceil(duration));
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("The selected video is invalid or unsupported"));
    };
    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Reading video metadata timed out"));
    }, 10_000);
    video.src = objectUrl;
  });

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return apiError.response?.data?.message || apiError.message || fallback;
};

const UploadVideo = () => {
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LOL");
  const [tags, setTags] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateFiles = () => {
    if (!uploadedVideoId && !videoFile) return "Please choose a video";
    if (videoFile && !videoFile.type.startsWith("video/"))
      return "Please choose a valid video file";
    if (videoFile && videoFile.size > MAX_VIDEO_SIZE)
      return "Video must be 500 MB or smaller";
    if (thumbnail && !thumbnail.type.startsWith("image/"))
      return "Thumbnail must be an image";
    if (thumbnail && thumbnail.size > MAX_IMAGE_SIZE)
      return "Thumbnail must be 5 MB or smaller";
    if (!title.trim()) return "Title is required";
    if (title.trim().length > 150)
      return "Title must be 150 characters or fewer";
    if (!description.trim()) return "Description is required";
    if (description.trim().length > 2_000)
      return "Description must be 2,000 characters or fewer";
    if (!category.trim()) return "Category is required";
    return "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validationError = validateFiles();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    let videoId = uploadedVideoId;

    try {
      if (!videoId) {
        if (!videoFile) throw new Error("Please choose a video");
        const duration = await getVideoDuration(videoFile);
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("category", category.trim());
        formData.append("tags", tags);
        formData.append("duration", String(duration));
        formData.append("type", "clip");

        const response = await instance.post<{ _id: string }>(
          "/videos",
          formData,
        );
        videoId = response.data._id;
        setUploadedVideoId(videoId);
      }

      if (thumbnail && videoId) {
        const thumbnailData = new FormData();
        thumbnailData.append("thumbnail", thumbnail);
        thumbnailData.append("status", "public");
        await instance.put(`/videos/${videoId}`, thumbnailData);
      }

      navigate("/profile/me", { replace: true });
    } catch (uploadError) {
      const fallback = videoId
        ? "The video was uploaded, but the thumbnail failed. Submit again to retry only the thumbnail."
        : "Upload failed";
      setError(getApiErrorMessage(uploadError, fallback));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="upload-video-page">
      <form className="upload-video" onSubmit={handleSubmit} noValidate>
        <div className="upload-video__heading">
          <p className="upload-video__eyebrow">Creator Studio</p>
          <h1>Upload a video</h1>
          <p>Share a clip with a clear title, description, and thumbnail.</p>
        </div>

        {error && (
          <p className="upload-video__error" role="alert">
            {error}
          </p>
        )}

        {uploadedVideoId && (
          <p className="upload-video__notice" role="status">
            Your video is saved. You can retry the thumbnail without uploading
            the video again.
          </p>
        )}

        <div className="upload-video__field upload-video__field--file">
          <label className="upload-video__label" htmlFor="upload-video-file">
            Video <span aria-hidden="true">*</span>
          </label>
          <input
            id="upload-video-file"
            className="upload-video__file-input"
            type="file"
            accept="video/*"
            disabled={loading || Boolean(uploadedVideoId)}
            required={!uploadedVideoId}
            onChange={(event) => {
              setVideoFile(event.target.files?.[0] || null);
              setUploadedVideoId(null);
              setError("");
            }}
          />
          <span className="upload-video__hint">
            {uploadedVideoId
              ? "Video already uploaded"
              : videoFile?.name ||
                "MP4, WebM, or another browser-supported format · max 500 MB"}
          </span>
        </div>

        <div className="upload-video__field">
          <label className="upload-video__label" htmlFor="upload-video-title">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="upload-video-title"
            className="upload-video__input"
            type="text"
            maxLength={150}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <span className="upload-video__counter">{title.length}/150</span>
        </div>

        <div className="upload-video__field">
          <label
            className="upload-video__label"
            htmlFor="upload-video-description"
          >
            Description <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="upload-video-description"
            className="upload-video__textarea"
            rows={5}
            maxLength={2_000}
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="upload-video__counter">
            {description.length}/2,000
          </span>
        </div>

        <div className="upload-video__grid">
          <div className="upload-video__field">
            <label
              className="upload-video__label"
              htmlFor="upload-video-category"
            >
              Category <span aria-hidden="true">*</span>
            </label>
            <select
              id="upload-video-category"
              className="upload-video__select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="LOL">League of Legends</option>
              <option value="PUBG">PUBG</option>
            </select>
          </div>

          <div className="upload-video__field">
            <label className="upload-video__label" htmlFor="upload-video-tags">
              Tags
            </label>
            <input
              id="upload-video-tags"
              className="upload-video__input"
              type="text"
              placeholder="gaming, highlights, ranked"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
            <span className="upload-video__hint">
              Separate up to 10 tags with commas.
            </span>
          </div>
        </div>

        <div className="upload-video__field upload-video__field--file">
          <label
            className="upload-video__label"
            htmlFor="upload-thumbnail-file"
          >
            Thumbnail
          </label>
          <input
            id="upload-thumbnail-file"
            className="upload-video__file-input"
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(event) => {
              setThumbnail(event.target.files?.[0] || null);
              setError("");
            }}
          />
          <span className="upload-video__hint">
            {thumbnail?.name || "JPG, PNG, or WebP · max 5 MB"}
          </span>
        </div>

        <div className="upload-video__actions">
          <button
            className="upload-video__btn upload-video__btn--secondary"
            type="button"
            disabled={loading}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="upload-video__btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Uploading…"
              : uploadedVideoId
                ? "Retry thumbnail"
                : "Upload video"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default UploadVideo;
