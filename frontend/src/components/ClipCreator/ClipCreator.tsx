import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCreateClipMutation } from "../../store/api/videoApi";
import "./ClipCreator.css";

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const ClipCreator = ({
  videoId,
  videoDuration,
  onClose,
}: {
  videoId: string;
  videoDuration: number;
  onClose: () => void;
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const duration = Number.isFinite(videoDuration)
    ? Math.max(0, videoDuration)
    : 0;
  const canCreateClip = duration >= 5;
  const initialEndTime = Math.min(30, duration);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createClip, { isLoading }] = useCreateClipMutation();

  const startMax = Math.max(0, duration - 5);
  const endMin = Math.min(duration, startTime + 5);
  const endMax = Math.max(endMin, Math.min(startTime + 60, duration));
  const clipDuration = useMemo(
    () => Math.max(0, endTime - startTime),
    [endTime, startTime],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalizedTitle = title.trim();

    if (!canCreateClip) {
      setError("Video này ngắn hơn 5 giây nên không thể tạo clip.");
      return;
    }
    if (!normalizedTitle) {
      setError("Vui lòng nhập tiêu đề clip");
      return;
    }
    if (clipDuration < 5 || clipDuration > 60 || endTime > duration) {
      setError("Clip phải dài từ 5 đến 60 giây và nằm trong thời lượng video.");
      return;
    }

    try {
      await createClip({
        videoId,
        startTime,
        endTime,
        title: normalizedTitle,
      }).unwrap();
      setSuccess(true);
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setError(apiError.data?.message || "Tạo clip thất bại");
    }
  };

  return (
    <div className="clip-creator" role="presentation">
      <button
        className="clip-creator__overlay"
        type="button"
        aria-label="Đóng cửa sổ tạo clip"
        disabled={isLoading}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="clip-creator__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          className="clip-creator__close"
          type="button"
          aria-label="Đóng"
          disabled={isLoading}
          onClick={onClose}
        >
          &times;
        </button>

        {success ? (
          <div className="clip-creator__success" role="status">
            <span aria-hidden="true">✂️</span>
            <h2 id={titleId}>Tạo clip thành công!</h2>
            <p>Clip đã được lưu vào profile của bạn.</p>
            <button
              className="clip-creator__btn"
              type="button"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} noValidate>
            <h2 id={titleId} className="clip-creator__title">
              Tạo clip
            </h2>
            <p className="clip-creator__desc">
              Cắt đoạn từ 5 đến 60 giây trong video này.
            </p>

            {error && (
              <p className="clip-creator__error" role="alert">
                {error}
              </p>
            )}

            <div className="clip-creator__field">
              <label htmlFor="clip-title">Tiêu đề clip</label>
              <input
                id="clip-title"
                type="text"
                maxLength={150}
                value={title}
                placeholder="Đặt tên cho clip..."
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="clip-creator__field">
              <label htmlFor="clip-start">
                Thời gian bắt đầu: <strong>{formatTime(startTime)}</strong>
              </label>
              <input
                id="clip-start"
                type="range"
                min={0}
                max={startMax}
                step={1}
                value={Math.min(startTime, startMax)}
                disabled={!canCreateClip}
                onChange={(event) => {
                  const nextStart = Number(event.target.value);
                  setStartTime(nextStart);
                  setEndTime((currentEnd) =>
                    Math.min(duration, Math.max(currentEnd, nextStart + 5)),
                  );
                }}
              />
            </div>

            <div className="clip-creator__field">
              <label htmlFor="clip-end">
                Thời gian kết thúc: <strong>{formatTime(endTime)}</strong>
              </label>
              <input
                id="clip-end"
                type="range"
                min={endMin}
                max={endMax}
                step={1}
                value={Math.min(Math.max(endTime, endMin), endMax)}
                disabled={!canCreateClip}
                onChange={(event) => setEndTime(Number(event.target.value))}
              />
            </div>

            <div className="clip-creator__preview">
              Độ dài clip: <strong>{formatTime(clipDuration)}</strong>
            </div>

            <button
              className="clip-creator__btn"
              type="submit"
              disabled={isLoading || !canCreateClip}
            >
              {isLoading ? "Đang tạo…" : "Tạo clip"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClipCreator;
