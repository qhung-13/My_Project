import { useEffect, useRef, useState } from "react";
import {
  useGetStreamKeyQuery,
  useResetStreamKeyMutation,
} from "../../store/api/userApi";
import { usePrepareStreamMutation } from "../../store/api/streamApi";
import ScheduleModal from "../ScheduleModal/ScheduleModal";
import "./GoLiveModal.css";

interface StreamKeyResponse {
  streamKey: string;
  rtmpServerUrl: string;
}

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

const GoLiveModal = ({ onClose }: { onClose: () => void }) => {
  const cardRef = useRef<HTMLElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<"server" | "key" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [tags, setTags] = useState("");
  const [setupSaved, setSetupSaved] = useState(false);

  const { data, isLoading, isError } = useGetStreamKeyQuery(undefined) as {
    data?: StreamKeyResponse;
    isLoading: boolean;
    isError: boolean;
  };
  const [resetStreamKey, { isLoading: isResetting }] =
    useResetStreamKeyMutation();
  const [prepareStream, { isLoading: isPreparing }] =
    usePrepareStreamMutation();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !showSchedule &&
        !isPreparing &&
        !isResetting
      )
        onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (feedbackTimerRef.current !== null)
        window.clearTimeout(feedbackTimerRef.current);
    };
  }, [isPreparing, isResetting, onClose, showSchedule]);

  const showTemporaryFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current !== null)
      window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      setCopied(null);
    }, 2_500);
  };

  const handleCopy = async (text: string, type: "server" | "key") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      showTemporaryFeedback("Đã sao chép vào clipboard.");
    } catch {
      showTemporaryFeedback("Không thể sao chép. Hãy chọn và copy thủ công.");
    }
  };

  const handlePrepare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSetupSaved(false);

    if (!title.trim()) {
      setError("Hãy nhập tiêu đề livestream trước khi bắt đầu.");
      return;
    }

    try {
      await prepareStream({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }).unwrap();
      setSetupSaved(true);
      showTemporaryFeedback(
        "Đã lưu thông tin. Bạn có thể bắt đầu stream từ OBS.",
      );
    } catch (requestError) {
      const apiError = requestError as { data?: { message?: string } };
      setError(apiError.data?.message || "Không thể lưu thông tin livestream.");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Tạo stream key mới? Key cũ sẽ ngừng hoạt động ngay."))
      return;

    try {
      await resetStreamKey(undefined).unwrap();
      setShowKey(false);
      setSetupSaved(false);
      showTemporaryFeedback("Đã tạo stream key mới.");
    } catch {
      setError("Không thể tạo stream key mới. Vui lòng thử lại.");
    }
  };

  const busy = isPreparing || isResetting;

  return (
    <div className="golive-modal" role="presentation">
      <button
        type="button"
        className="golive-modal__overlay"
        disabled={busy}
        onClick={onClose}
        aria-label="Đóng cửa sổ Go Live"
      />
      <section
        ref={cardRef}
        className="golive-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="golive-title"
        aria-describedby="golive-description"
        tabIndex={-1}
      >
        <button
          type="button"
          className="golive-modal__close"
          disabled={busy}
          onClick={onClose}
          aria-label="Đóng"
        >
          &times;
        </button>

        <h2 id="golive-title" className="golive-modal__title">
          Go Live
        </h2>
        <p id="golive-description" className="golive-modal__desc">
          Lưu thông tin kênh, sau đó dùng cấu hình dưới đây trong OBS.
        </p>

        {feedback && (
          <p
            className="golive-modal__feedback"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        )}
        {error && (
          <p className="golive-modal__error" role="alert">
            {error}
          </p>
        )}

        <form
          className="golive-modal__setup"
          onSubmit={handlePrepare}
          noValidate
        >
          <h3>1. Thông tin livestream</h3>
          <div className="golive-modal__field">
            <label
              className="golive-modal__label"
              htmlFor="golive-stream-title"
            >
              Tiêu đề <span aria-hidden="true">*</span>
            </label>
            <input
              id="golive-stream-title"
              className="golive-modal__input golive-modal__input--standard"
              type="text"
              maxLength={120}
              value={title}
              placeholder="Ví dụ: Leo rank cùng mọi người"
              onChange={(event) => {
                setTitle(event.target.value);
                setSetupSaved(false);
              }}
            />
          </div>

          <div className="golive-modal__field">
            <label
              className="golive-modal__label"
              htmlFor="golive-description-input"
            >
              Mô tả
            </label>
            <textarea
              id="golive-description-input"
              className="golive-modal__textarea"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setSetupSaved(false);
              }}
            />
          </div>

          <div className="golive-modal__setup-grid">
            <div className="golive-modal__field">
              <label className="golive-modal__label" htmlFor="golive-category">
                Category
              </label>
              <select
                id="golive-category"
                className="golive-modal__select"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setSetupSaved(false);
                }}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="golive-modal__field">
              <label className="golive-modal__label" htmlFor="golive-tags">
                Tags
              </label>
              <input
                id="golive-tags"
                className="golive-modal__input golive-modal__input--standard"
                type="text"
                value={tags}
                placeholder="ranked, highlights"
                onChange={(event) => {
                  setTags(event.target.value);
                  setSetupSaved(false);
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="golive-modal__btn golive-modal__btn--primary golive-modal__btn--wide"
            disabled={isPreparing}
          >
            {isPreparing
              ? "Đang lưu…"
              : setupSaved
                ? "Đã lưu thông tin"
                : "Lưu thông tin stream"}
          </button>
        </form>

        <div className="golive-modal__divider" />
        <h3 className="golive-modal__section-title">2. Cấu hình OBS</h3>

        {isLoading ? (
          <div className="golive-modal__loading" role="status">
            Đang tải…
          </div>
        ) : isError || !data ? (
          <div className="golive-modal__error" role="alert">
            Không thể tải cấu hình stream. Vui lòng đăng nhập lại hoặc thử lại
            sau.
          </div>
        ) : (
          <>
            <div className="golive-modal__field">
              <label className="golive-modal__label" htmlFor="rtmp-server-url">
                Server URL
              </label>
              <div className="golive-modal__row">
                <input
                  id="rtmp-server-url"
                  className="golive-modal__input"
                  type="text"
                  value={data.rtmpServerUrl}
                  readOnly
                />
                <button
                  type="button"
                  className="golive-modal__btn"
                  onClick={() => handleCopy(data.rtmpServerUrl, "server")}
                >
                  {copied === "server" ? "Đã copy" : "Copy"}
                </button>
              </div>
            </div>

            <div className="golive-modal__field">
              <label className="golive-modal__label" htmlFor="stream-key">
                Stream Key
              </label>
              <div className="golive-modal__row golive-modal__row--key">
                <input
                  id="stream-key"
                  className="golive-modal__input"
                  type={showKey ? "text" : "password"}
                  value={data.streamKey}
                  readOnly
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="golive-modal__btn"
                  onClick={() => setShowKey((current) => !current)}
                  aria-pressed={showKey}
                >
                  {showKey ? "Ẩn" : "Hiện"}
                </button>
                <button
                  type="button"
                  className="golive-modal__btn golive-modal__btn--primary"
                  onClick={() => handleCopy(data.streamKey, "key")}
                >
                  {copied === "key" ? "Đã copy" : "Copy"}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="golive-modal__btn golive-modal__btn--danger"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? "Đang tạo…" : "Tạo Stream Key mới"}
            </button>

            <div className="golive-modal__guide">
              <h3 className="golive-modal__guide-title">Hướng dẫn OBS</h3>
              <ol>
                <li>
                  Mở OBS → <strong>Settings</strong> → <strong>Stream</strong>.
                </li>
                <li>
                  Chọn service <strong>Custom</strong>.
                </li>
                <li>Dán Server URL và Stream Key ở trên.</li>
                <li>
                  Lưu thông tin ở bước 1 rồi nhấn{" "}
                  <strong>Start Streaming</strong>.
                </li>
              </ol>
            </div>

            <button
              type="button"
              className="golive-modal__btn golive-modal__btn--schedule"
              onClick={() => setShowSchedule(true)}
            >
              Đặt lịch livestream
            </button>

            {showSchedule && (
              <ScheduleModal onClose={() => setShowSchedule(false)} />
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default GoLiveModal;
