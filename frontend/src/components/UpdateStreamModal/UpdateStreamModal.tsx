import { useEffect, useId, useRef, useState } from "react";
import { useUpdateLiveStreamMutation } from "../../store/api/streamApi";
import type { Stream } from "../../types/index";
import "./UpdateStreamModal.css";

const CATEGORIES = [
  "LOL",
  "PUBG",
  "CS2",
  "Valorant",
  "Dota 2",
  "FIFA",
  "MLBB",
  "COD",
  "Other",
];

const UpdateStreamModal = ({
  currentStream,
  onClose,
}: {
  currentStream: Stream;
  onClose: () => void;
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [title, setTitle] = useState(currentStream.title);
  const [description, setDescription] = useState(
    currentStream.description || "",
  );
  const [category, setCategory] = useState(currentStream.category);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [updateLiveStream, { isLoading }] = useUpdateLiveStreamMutation();

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
      if (closeTimerRef.current !== null)
        window.clearTimeout(closeTimerRef.current);
    };
  }, [isLoading, onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Tiêu đề không được để trống");
      return;
    }

    try {
      await updateLiveStream({
        title: normalizedTitle,
        description: description.trim(),
        category,
      }).unwrap();
      setSuccess(true);
      closeTimerRef.current = window.setTimeout(onClose, 1_200);
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setError(apiError.data?.message || "Cập nhật thất bại");
    }
  };

  return (
    <div className="update-stream-modal" role="presentation">
      <button
        className="update-stream-modal__overlay"
        type="button"
        aria-label="Đóng cửa sổ cập nhật stream"
        disabled={isLoading}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="update-stream-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          className="update-stream-modal__close"
          type="button"
          aria-label="Đóng"
          disabled={isLoading}
          onClick={onClose}
        >
          &times;
        </button>

        <h2 id={titleId} className="update-stream-modal__title">
          Cập nhật thông tin stream
        </h2>

        {success ? (
          <div className="update-stream-modal__success" role="status">
            Cập nhật thành công!
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <p className="update-stream-modal__error" role="alert">
                {error}
              </p>
            )}

            <div className="update-stream-modal__field">
              <label htmlFor="update-stream-title">Tiêu đề</label>
              <input
                id="update-stream-title"
                type="text"
                maxLength={120}
                value={title}
                placeholder="Tiêu đề stream..."
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="update-stream-modal__field">
              <label htmlFor="update-stream-description">Mô tả</label>
              <textarea
                id="update-stream-description"
                maxLength={1000}
                value={description}
                placeholder="Mô tả stream..."
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="update-stream-modal__field">
              <label htmlFor="update-stream-category">Category</label>
              <select
                id="update-stream-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="update-stream-modal__btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Đang cập nhật…" : "Lưu thay đổi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateStreamModal;
