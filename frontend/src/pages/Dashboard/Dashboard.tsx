import { useState } from "react";
import {
  useGetStreamKeyQuery,
  useResetStreamKeyMutation,
} from "../../store/api/userApi";
import "./Dashboard.css";

const Dashboard = () => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useGetStreamKeyQuery(undefined);
  console.log(data);
  const [resetStreamKey, { isLoading: isResetting }] =
    useResetStreamKeyMutation();

  const handleCopy = () => {
    if (!data?.streamKey) return;
    navigator.clipboard.writeText(data.streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Bạn chắc chắn muốn tạo stream key mới? Stream key cũ sẽ không dùng được nữa.",
      )
    )
      return;
    await resetStreamKey(undefined).unwrap();
  };

  if (isLoading) return <div className="dashboard__loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">📊 Dashboard</h1>

      {/* Stream Key Section */}
      <div className="dashboard__card">
        <h2 className="dashboard__card-title">🔑 Stream Key</h2>
        <p className="dashboard__card-desc">
          Dùng thông tin này để cấu hình OBS hoặc phần mềm stream khác.
        </p>

        {/* RTMP URL */}
        <div className="dashboard__field">
          <label className="dashboard__label">Server URL</label>
          <div className="dashboard__input-row">
            <input
              className="dashboard__input"
              type="text"
              value="rtmp://localhost/live"
              readOnly
            />
            <button
              className="dashboard__btn"
              onClick={() => {
                navigator.clipboard.writeText("rtmp://localhost/live");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Stream Key */}
        <div className="dashboard__field">
          <label className="dashboard__label">Stream Key</label>
          <div className="dashboard__input-row">
            <input
              className="dashboard__input"
              type={showKey ? "text" : "password"}
              value={data?.streamKey || ""}
              readOnly
            />
            <button
              className="dashboard__btn"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Ẩn" : "Hiện"}
            </button>
            <button
              className="dashboard__btn dashboard__btn--primary"
              onClick={handleCopy}
            >
              {copied ? "✅ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <button
          className="dashboard__btn dashboard__btn--danger"
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting ? "Đang tạo..." : "🔄 Tạo Stream Key mới"}
        </button>
      </div>

      {/* OBS Guide */}
      <div className="dashboard__card">
        <h2 className="dashboard__card-title">📖 Hướng dẫn OBS</h2>
        <ol className="dashboard__guide">
          <li>
            Mở OBS → <strong>Settings</strong> → <strong>Stream</strong>
          </li>
          <li>
            Service: chọn <strong>Custom</strong>
          </li>
          <li>
            Server: nhập <strong>rtmp://localhost/live</strong>
          </li>
          <li>Stream Key: paste stream key của bạn vào</li>
          <li>
            Click <strong>Apply</strong> → <strong>OK</strong>
          </li>
          <li>
            Click <strong>Start Streaming</strong>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
