import { useState } from "react";
import {
  useGetStreamKeyQuery,
  useResetStreamKeyMutation,
} from "../../store/api/userApi";
import ScheduleModal from "../ScheduleModal/ScheduleModal";
import "./GoLiveModal.css";

const GoLiveModal = ({ onClose }: { onClose: () => void }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<"server" | "key" | null>(null);

  const { data, isLoading } = useGetStreamKeyQuery(undefined);
  const [showSchedule, setShowSchedule] = useState(false);
  const [resetStreamKey, { isLoading: isResetting }] =
    useResetStreamKeyMutation();

  const handleCopy = (text: string, type: "server" | "key") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = async () => {
    if (!confirm("Tạo stream key mới? Key cũ sẽ không dùng được nữa.")) return;
    await resetStreamKey(undefined).unwrap();
  };

  return (
    <div className="golive-modal">
      <div className="golive-modal__overlay" onClick={onClose} />
      <div className="golive-modal__card">
        <button className="golive-modal__close" onClick={onClose}>
          &times;
        </button>

        <h2 className="golive-modal__title">🎥 Go Live</h2>
        <p className="golive-modal__desc">
          Dùng thông tin dưới đây để cấu hình OBS rồi bắt đầu stream!
        </p>

        {isLoading ? (
          <div className="golive-modal__loading">Loading...</div>
        ) : (
          <>
            {/* Server URL */}
            <div className="golive-modal__field">
              <label className="golive-modal__label">Server URL</label>
              <div className="golive-modal__row">
                <input
                  className="golive-modal__input"
                  type="text"
                  value="rtmp://localhost/live"
                  readOnly
                />
                <button
                  className="golive-modal__btn"
                  onClick={() => handleCopy("rtmp://localhost/live", "server")}
                >
                  {copied === "server" ? "✅ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Stream Key */}
            <div className="golive-modal__field">
              <label className="golive-modal__label">Stream Key</label>
              <div className="golive-modal__row">
                <input
                  className="golive-modal__input"
                  type={showKey ? "text" : "password"}
                  value={data?.streamKey || ""}
                  readOnly
                />
                <button
                  className="golive-modal__btn"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? "Ẩn" : "Hiện"}
                </button>
                <button
                  className="golive-modal__btn golive-modal__btn--primary"
                  onClick={() => handleCopy(data?.streamKey || "", "key")}
                >
                  {copied === "key" ? "✅ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <button
              className="golive-modal__btn golive-modal__btn--danger"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? "Đang tạo..." : "🔄 Tạo Stream Key mới"}
            </button>

            {/* OBS Guide */}
            <div className="golive-modal__guide">
              <h3 className="golive-modal__guide-title">📖 Hướng dẫn OBS</h3>
              <ol>
                <li>
                  Mở OBS → <strong>Settings</strong> → <strong>Stream</strong>
                </li>
                <li>
                  Service: chọn <strong>Custom</strong>
                </li>
                <li>
                  Server: paste <strong>Server URL</strong> vào
                </li>
                <li>
                  Stream Key: paste <strong>Stream Key</strong> vào
                </li>
                <li>
                  Click <strong>Apply</strong> → <strong>OK</strong>
                </li>
                <li>
                  Click <strong>Start Streaming</strong> 🚀
                </li>
              </ol>
            </div>

            <button
              className="golive-modal__btn"
              style={{
                width: "100%",
                marginTop: "12px",
                background: "#f0f0ff",
                color: "#6366f1",
                borderColor: "#c7d2fe",
              }}
              onClick={() => setShowSchedule(true)}
            >
              📅 Đặt lịch livestream
            </button>

            {showSchedule && (
              <ScheduleModal onClose={() => setShowSchedule(false)} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GoLiveModal;
