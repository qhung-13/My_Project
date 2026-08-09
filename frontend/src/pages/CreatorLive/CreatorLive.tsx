import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Copy,
  Eye,
  KeyRound,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Settings2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  useGetStreamKeyQuery,
  useResetStreamKeyMutation,
} from "../../store/api/userApi";
import {
  useGetCurrentStreamQuery,
  useGetStreamAnalyticsQuery,
  useAskCreatorCoachMutation,
} from "../../store/api/streamApi";
import type { Stream } from "../../types/index";
import VideoPlayer from "../WatchLive/VideoPlayer/VideoPlayer";
import GoLiveModal from "../../components/GoLiveModal/GoLiveModal";
import "./CreatorLive.css";

interface CurrentStreamResponse {
  stream: Stream | null;
}

interface StreamKeyResponse {
  streamKey: string;
  rtmpServerUrl: string;
}

interface AnalyticsResponse {
  totalStreams: number;
  totalHours: number;
  avgViewers: number;
  peakViewers: number;
  totalCoinsReceived: number;
}

const formatDuration = (startedAt?: string) => {
  if (!startedAt) return "00:00:00";
  const totalSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const CreatorLive = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showSetup, setShowSetup] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<"server" | "key" | null>(null);
  const [actionError, setActionError] = useState("");
  const [coachQuestion, setCoachQuestion] = useState(
    "Dựa trên dữ liệu hiện tại, mình nên cải thiện lịch live và nội dung thế nào?",
  );
  const [coachAnswer, setCoachAnswer] = useState("");
  const [coachError, setCoachError] = useState("");
  const copyTimerRef = useRef<number | null>(null);

  const {
    data: currentData,
    isLoading: isStreamLoading,
    isFetching: isStreamFetching,
    isError: isStreamError,
    refetch: refetchCurrentStream,
  } = useGetCurrentStreamQuery(undefined, {
    pollingInterval: 3_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  }) as {
    data?: CurrentStreamResponse;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => unknown;
  };

  const { data: streamKeyData, isLoading: isKeyLoading } = useGetStreamKeyQuery(
    undefined,
  ) as {
    data?: StreamKeyResponse;
    isLoading: boolean;
  };

  const { data: analytics } = useGetStreamAnalyticsQuery(user?._id ?? "", {
    skip: !user?._id,
  }) as { data?: AnalyticsResponse };

  const [resetStreamKey, { isLoading: isResettingKey }] =
    useResetStreamKeyMutation();
  const [askCreatorCoach, { isLoading: isCoachLoading }] =
    useAskCreatorCoachMutation();

  const stream = currentData?.stream ?? null;
  const isLive = Boolean(stream?.isLive);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null)
        window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const copyValue = async (value: string, type: "server" | "key") => {
    if (!value) return;
    setActionError("");
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      if (copyTimerRef.current !== null)
        window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(null), 1_600);
    } catch {
      setActionError("Không thể sao chép tự động. Hãy chọn và copy thủ công.");
    }
  };

  const handleResetKey = async () => {
    if (
      !window.confirm(
        "Tạo stream key mới? OBS đang lưu key cũ sẽ không thể phát cho đến khi bạn cập nhật key mới.",
      )
    )
      return;
    setActionError("");
    try {
      await resetStreamKey(undefined).unwrap();
      setShowKey(false);
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      setActionError(
        apiError.data?.message || "Không thể tạo stream key mới lúc này.",
      );
    }
  };

  const handleAskCoach = async () => {
    const message = coachQuestion.trim();
    if (!message) return;
    setCoachError("");
    try {
      const response = await askCreatorCoach({ message }).unwrap();
      setCoachAnswer(response.answer);
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      setCoachError(
        apiError.data?.message ||
          "Creator Coach chưa sẵn sàng. Hãy kiểm tra agent-service và GOOGLE_API_KEY.",
      );
    }
  };

  return (
    <main className="creator-live">
      <header className="creator-live__hero">
        <div>
          <span className="creator-live__eyebrow">Creator Studio</span>
          <h1>Stream Console</h1>
          <p>
            Chuẩn bị OBS, theo dõi trạng thái phát và kiểm soát phiên livestream
            trong một nơi.
          </p>
        </div>
        <div className="creator-live__hero-actions">
          <button
            type="button"
            className="creator-live__btn creator-live__btn--secondary"
            onClick={() => void refetchCurrentStream()}
            disabled={isStreamFetching}
          >
            <RefreshCw size={17} aria-hidden="true" />
            Làm mới
          </button>
          <button
            type="button"
            className="creator-live__btn creator-live__btn--primary"
            onClick={() => setShowSetup(true)}
          >
            <Settings2 size={17} aria-hidden="true" />
            Cấu hình stream
          </button>
        </div>
      </header>

      <section className="creator-live__status-card" aria-live="polite">
        <div
          className={`creator-live__status-light ${isLive ? "is-live" : ""}`}
        />
        <div>
          <span className="creator-live__status-label">
            {isLive ? "ON AIR" : stream ? "READY" : "SETUP REQUIRED"}
          </span>
          <strong>
            {isLive
              ? "Livestream đang phát"
              : stream
                ? "Đang chờ tín hiệu từ OBS"
                : "Hãy lưu thông tin stream trước khi mở OBS"}
          </strong>
        </div>
        {isLive && stream && (
          <button
            type="button"
            className="creator-live__public-link"
            onClick={() => navigate(`/stream/${stream._id}`)}
          >
            <Eye size={16} aria-hidden="true" />
            Mở trang người xem
          </button>
        )}
      </section>

      {(actionError || isStreamError) && (
        <div className="creator-live__error" role="alert">
          <span>
            {actionError || "Không thể đồng bộ trạng thái stream với backend."}
          </span>
          {isStreamError && (
            <button type="button" onClick={() => void refetchCurrentStream()}>
              Thử lại
            </button>
          )}
        </div>
      )}

      <div className="creator-live__workspace">
        <section className="creator-live__preview-card">
          <div className="creator-live__section-heading">
            <div>
              <span>Preview</span>
              <h2>{stream?.title || "Chưa có phiên stream"}</h2>
            </div>
            {isLive && (
              <span className="creator-live__live-pill">
                <Radio size={14} aria-hidden="true" /> LIVE
              </span>
            )}
          </div>

          <div className="creator-live__preview">
            {isLive && stream?.hlsUrl ? (
              <VideoPlayer streamUrl={stream.hlsUrl} />
            ) : (
              <div className="creator-live__standby">
                <Radio size={38} aria-hidden="true" />
                <strong>
                  {stream ? "Waiting for OBS" : "No stream configured"}
                </strong>
                <span>
                  {stream
                    ? "Nhấn Start Streaming trong OBS. Console sẽ tự chuyển sang LIVE."
                    : "Chọn Cấu hình stream để tạo phiên livestream mới."}
                </span>
              </div>
            )}
          </div>

          <div className="creator-live__telemetry">
            <div>
              <Users size={18} aria-hidden="true" />
              <span>Người xem</span>
              <strong>{stream?.viewers ?? 0}</strong>
            </div>
            <div>
              <Activity size={18} aria-hidden="true" />
              <span>Thời lượng</span>
              <strong>
                {isLive ? formatDuration(stream?.startedAt) : "--:--:--"}
              </strong>
            </div>
            <div>
              <BarChart3 size={18} aria-hidden="true" />
              <span>Peak</span>
              <strong>{stream?.peakViewers ?? 0}</strong>
            </div>
          </div>
        </section>

        <aside className="creator-live__side">
          <section className="creator-live__config-card">
            <div className="creator-live__section-heading creator-live__section-heading--compact">
              <div>
                <span>OBS Connection</span>
                <h2>Stream credentials</h2>
              </div>
              <KeyRound size={20} aria-hidden="true" />
            </div>

            {isKeyLoading || !streamKeyData ? (
              <p className="creator-live__muted">Đang tải cấu hình OBS…</p>
            ) : (
              <>
                <label className="creator-live__field">
                  <span>Server URL</span>
                  <div>
                    <input value={streamKeyData.rtmpServerUrl} readOnly />
                    <button
                      type="button"
                      onClick={() =>
                        void copyValue(streamKeyData.rtmpServerUrl, "server")
                      }
                      aria-label="Copy RTMP server URL"
                    >
                      <Copy size={16} aria-hidden="true" />
                      {copied === "server" ? "Đã copy" : "Copy"}
                    </button>
                  </div>
                </label>

                <label className="creator-live__field">
                  <span>Stream Key</span>
                  <div>
                    <input
                      value={streamKeyData.streamKey}
                      type={showKey ? "text" : "password"}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((current) => !current)}
                    >
                      {showKey ? "Ẩn" : "Hiện"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void copyValue(streamKeyData.streamKey, "key")
                      }
                    >
                      <Copy size={16} aria-hidden="true" />
                      {copied === "key" ? "Đã copy" : "Copy"}
                    </button>
                  </div>
                </label>

                <button
                  type="button"
                  className="creator-live__reset-key"
                  onClick={() => void handleResetKey()}
                  disabled={isResettingKey || isLive}
                  title={
                    isLive ? "Không đổi stream key khi đang phát" : undefined
                  }
                >
                  {isResettingKey ? "Đang tạo key…" : "Regenerate stream key"}
                </button>
              </>
            )}
          </section>

          <section className="creator-live__analytics-card">
            <div className="creator-live__section-heading creator-live__section-heading--compact">
              <div>
                <span>Channel snapshot</span>
                <h2>Analytics</h2>
              </div>
            </div>
            <div className="creator-live__analytics-grid">
              <div>
                <span>Tổng stream</span>
                <strong>{analytics?.totalStreams ?? 0}</strong>
              </div>
              <div>
                <span>Giờ đã live</span>
                <strong>{analytics?.totalHours ?? 0}h</strong>
              </div>
              <div>
                <span>Avg viewers</span>
                <strong>{analytics?.avgViewers ?? 0}</strong>
              </div>
              <div>
                <span>Coins nhận</span>
                <strong>{analytics?.totalCoinsReceived ?? 0}</strong>
              </div>
            </div>
          </section>

          <section className="creator-live__coach-card">
            <div className="creator-live__section-heading creator-live__section-heading--compact">
              <div>
                <span>AI insights</span>
                <h2>Creator Coach</h2>
              </div>
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <p className="creator-live__muted">
              Coach chỉ đọc analytics của tài khoản hiện tại và không có quyền
              moderation hay thay đổi dữ liệu.
            </p>
            <label className="creator-live__coach-field">
              <span>Câu hỏi</span>
              <textarea
                value={coachQuestion}
                onChange={(event) => setCoachQuestion(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Ví dụ: Mình nên live khung giờ nào?"
              />
            </label>
            <button
              type="button"
              className="creator-live__coach-submit"
              onClick={() => void handleAskCoach()}
              disabled={isCoachLoading || !coachQuestion.trim()}
            >
              <Send size={16} aria-hidden="true" />
              {isCoachLoading ? "Đang phân tích…" : "Hỏi Creator Coach"}
            </button>
            {coachError && (
              <p className="creator-live__coach-error" role="alert">
                {coachError}
              </p>
            )}
            {coachAnswer && (
              <div className="creator-live__coach-answer" aria-live="polite">
                {coachAnswer}
              </div>
            )}
          </section>
        </aside>
      </div>

      {isStreamLoading && (
        <div className="creator-live__loading" role="status">
          Đang tải Stream Console…
        </div>
      )}

      {showSetup && <GoLiveModal onClose={() => setShowSetup(false)} />}
    </main>
  );
};

export default CreatorLive;
