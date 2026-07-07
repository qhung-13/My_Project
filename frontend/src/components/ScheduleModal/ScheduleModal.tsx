import { useState } from "react";
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

const ScheduleModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LOL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [scheduleStream, { isLoading }] = useScheduleStreamMutation();

  const handleSubmit = async () => {
    setError("");
    if (!title || !scheduledAt) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      await scheduleStream({
        title,
        description,
        category,
        scheduledAt,
      }).unwrap();
      setSuccess(true);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Đặt lịch thất bại");
    }
  };

  return (
    <div className="schedule-modal">
      <div className="schedule-modal__overlay" onClick={onClose} />
      <div className="schedule-modal__card">
        <button className="schedule-modal__close" onClick={onClose}>
          &times;
        </button>

        {success ? (
          <div className="schedule-modal__success">
            <span>✅</span>
            <h2>Đặt lịch thành công!</h2>
            <p>Followers của bạn đã được thông báo.</p>
            <button className="schedule-modal__btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <>
            <h2 className="schedule-modal__title">📅 Đặt lịch livestream</h2>
            <p className="schedule-modal__desc">
              Thông báo cho followers biết khi nào bạn sẽ live.
            </p>

            {error && <p className="schedule-modal__error">{error}</p>}

            <div className="schedule-modal__field">
              <label>Tiêu đề stream</label>
              <input
                type="text"
                placeholder="VD: Rank Challenger LOL..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="schedule-modal__field">
              <label>Mô tả</label>
              <textarea
                placeholder="Mô tả ngắn về stream..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="schedule-modal__field">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="schedule-modal__field">
              <label>Thời gian live</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <button
              className="schedule-modal__btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Đang đặt lịch..." : "📅 Đặt lịch"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleModal;
