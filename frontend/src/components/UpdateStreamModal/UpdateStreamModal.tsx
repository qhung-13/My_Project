import { useState } from "react";
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
  const [title, setTitle] = useState(currentStream.title);
  const [description, setDescription] = useState(
    currentStream.description || "",
  );
  const [category, setCategory] = useState(currentStream.category);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [updateLiveStream, { isLoading }] = useUpdateLiveStreamMutation();

  const handleSubmit = async () => {
    setError("");
    if (!title) {
      setError("Tiêu đề không được để trống");
      return;
    }
    try {
      await updateLiveStream({ title, description, category }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error.data?.message || "Cập nhật thất bại");
    }
  };

  return (
    <div className="update-stream-modal">
      <div className="update-stream-modal__overlay" onClick={onClose} />
      <div className="update-stream-modal__card">
        <button className="update-stream-modal__close" onClick={onClose}>
          &times;
        </button>

        <h2 className="update-stream-modal__title">
          ✏️ Cập nhật thông tin stream
        </h2>

        {success ? (
          <div className="update-stream-modal__success">
            ✅ Cập nhật thành công!
          </div>
        ) : (
          <>
            {error && <p className="update-stream-modal__error">{error}</p>}

            <div className="update-stream-modal__field">
              <label>Tiêu đề</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề stream..."
              />
            </div>

            <div className="update-stream-modal__field">
              <label>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả stream..."
                rows={3}
              />
            </div>

            <div className="update-stream-modal__field">
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

            <button
              className="update-stream-modal__btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Đang cập nhật..." : "💾 Lưu thay đổi"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateStreamModal;
