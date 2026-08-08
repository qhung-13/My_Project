import { useEffect, useId, useRef, useState } from "react";
import { useScheduleStreamMutation } from "../../store/api/streamApi";
import "./ScheduleModal.css";

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

const toLocalDateTimeInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const ScheduleModal = ({ onClose }: { onClose: () => void }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LOL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scheduleStream, { isLoading }] = useScheduleStreamMutation();

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalizedTitle = title.trim();
    const scheduledDate = new Date(scheduledAt);

    if (
      !normalizedTitle ||
      !scheduledAt ||
      Number.isNaN(scheduledDate.getTime())
    ) {
      setError("Vui lòng nhập tiêu đề và thời gian hợp lệ.");
      return;
    }
    if (scheduledDate.getTime() <= Date.now() + 60_000) {
      setError("Thời gian livestream phải cách hiện tại ít nhất 1 phút.");
      return;
    }

    try {
      await scheduleStream({
        title: normalizedTitle,
        description: description.trim(),
        category,
        scheduledAt: scheduledDate.toISOString(),
      }).unwrap();
      setSuccess(true);
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setError(apiError.data?.message || "Đặt lịch thất bại");
    }
  };

  return (
    <div className="schedule-modal" role="presentation">
      <button
        className="schedule-modal__overlay"
        type="button"
        aria-label="Đóng cửa sổ đặt lịch"
        disabled={isLoading}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="schedule-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          className="schedule-modal__close"
          type="button"
          aria-label="Đóng"
          disabled={isLoading}
          onClick={onClose}
        >
          &times;
        </button>

        {success ? (
          <div className="schedule-modal__success" role="status">
            <span aria-hidden="true">✅</span>
            <h2 id={titleId}>Đặt lịch thành công!</h2>
            <p>Followers của bạn đã được thông báo.</p>
            <button
              className="schedule-modal__btn"
              type="button"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id={titleId} className="schedule-modal__title">
              Đặt lịch livestream
            </h2>
            <p className="schedule-modal__desc">
              Thông báo cho followers biết khi nào bạn sẽ live.
            </p>

            {error && (
              <p className="schedule-modal__error" role="alert">
                {error}
              </p>
            )}

            <div className="schedule-modal__field">
              <label htmlFor="schedule-title">Tiêu đề stream</label>
              <input
                id="schedule-title"
                type="text"
                maxLength={120}
                value={title}
                placeholder="VD: Rank Challenger LOL..."
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="schedule-modal__field">
              <label htmlFor="schedule-description">Mô tả</label>
              <textarea
                id="schedule-description"
                maxLength={1000}
                value={description}
                placeholder="Mô tả ngắn về stream..."
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="schedule-modal__field">
              <label htmlFor="schedule-category">Category</label>
              <select
                id="schedule-category"
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

            <div className="schedule-modal__field">
              <label htmlFor="schedule-time">Thời gian live</label>
              <input
                id="schedule-time"
                type="datetime-local"
                value={scheduledAt}
                min={toLocalDateTimeInput(new Date(Date.now() + 60_000))}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <button
              className="schedule-modal__btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Đang đặt lịch…" : "Đặt lịch"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleModal;
