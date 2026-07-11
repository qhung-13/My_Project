import { useState } from "react";
import { useCreateClipMutation } from "../../store/api/videoApi";
import "./ClipCreator.css";

const ClipCreator = ({
  videoId,
  videoDuration,
  onClose,
}: {
  videoId: string;
  videoDuration: number;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(30, videoDuration));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [createClip, { isLoading }] = useCreateClipMutation();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleCreate = async () => {
    setError("");
    if (!title) {
      setError("Vui lòng nhập tiêu đề clip");
      return;
    }
    if (endTime - startTime < 5) {
      setError("Clip phải dài ít nhất 5 giây");
      return;
    }
    if (endTime - startTime > 60) {
      setError("Clip tối đa 60 giây");
      return;
    }

    try {
      await createClip({ videoId, startTime, endTime, title }).unwrap();
      setSuccess(true);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Tạo clip thất bại");
    }
  };

  return (
    <div className="clip-creator">
      <div className="clip-creator__overlay" onClick={onClose} />
      <div className="clip-creator__card">
        <button className="clip-creator__close" onClick={onClose}>
          &times;
        </button>

        {success ? (
          <div className="clip-creator__success">
            <span>✂️</span>
            <h2>Tạo clip thành công!</h2>
            <p>Clip đã được lưu vào profile của bạn.</p>
            <button className="clip-creator__btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : (
          <>
            <h2 className="clip-creator__title">✂️ Tạo Clip</h2>
            <p className="clip-creator__desc">
              Cắt đoạn hay từ video này (tối đa 60 giây)
            </p>

            {error && <p className="clip-creator__error">{error}</p>}

            <div className="clip-creator__field">
              <label>Tiêu đề clip</label>
              <input
                type="text"
                placeholder="Đặt tên cho clip..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="clip-creator__field">
              <label>
                Thời gian bắt đầu: <strong>{formatTime(startTime)}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={videoDuration - 5}
                value={startTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartTime(val);
                  if (endTime <= val + 5)
                    setEndTime(Math.min(val + 30, videoDuration));
                }}
              />
            </div>

            <div className="clip-creator__field">
              <label>
                Thời gian kết thúc: <strong>{formatTime(endTime)}</strong>
              </label>
              <input
                type="range"
                min={startTime + 5}
                max={Math.min(startTime + 60, videoDuration)}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
            </div>

            <div className="clip-creator__preview">
              ⏱ Độ dài clip: <strong>{formatTime(endTime - startTime)}</strong>
            </div>

            <button
              className="clip-creator__btn"
              onClick={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo..." : "✂️ Tạo Clip"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClipCreator;
