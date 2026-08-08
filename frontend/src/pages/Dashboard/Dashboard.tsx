import { RefreshCw, WalletCards } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetStreamAnalyticsQuery } from "../../store/api/streamApi";
import type { RootState } from "../../store/store";
import type { ViewerHistory } from "../../types/index";
import { formatViewers } from "../../utils/format";
import "./Dashboard.css";

interface StreamAnalytics {
  totalStreams: number;
  totalHours: number;
  avgViewers: number;
  peakViewers: number;
  totalCoinsReceived: number;
  viewerHistory: ViewerHistory[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userId = useSelector((state: RootState) => state.auth.user?._id ?? "");
  const { data, isLoading, isError, isFetching, refetch } =
    useGetStreamAnalyticsQuery(userId, { skip: !userId }) as {
      data?: StreamAnalytics;
      isLoading: boolean;
      isError: boolean;
      isFetching: boolean;
      refetch: () => unknown;
    };

  const stats = [
    {
      label: "Tổng streams",
      value: formatViewers(data?.totalStreams ?? 0),
      icon: "🎥",
    },
    {
      label: "Tổng giờ live",
      value: `${Math.max(0, data?.totalHours ?? 0).toLocaleString("vi-VN")}h`,
      icon: "⏱",
    },
    {
      label: "Viewers trung bình",
      value: formatViewers(data?.avgViewers ?? 0),
      icon: "👥",
    },
    {
      label: "Peak viewers",
      value: formatViewers(data?.peakViewers ?? 0),
      icon: "🔝",
    },
    {
      label: "Xu nhận được",
      value: formatViewers(data?.totalCoinsReceived ?? 0),
      icon: "🪙",
    },
  ];

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Creator center</p>
          <h1 className="dashboard__title">Stream Dashboard</h1>
        </div>
        <button
          type="button"
          className="dashboard__btn dashboard__btn--primary"
          onClick={() => navigate("/topup")}
        >
          <WalletCards size={17} aria-hidden="true" />
          Nạp Xu
        </button>
      </header>

      {isLoading ? (
        <div className="dashboard__state" role="status">
          Đang tải analytics...
        </div>
      ) : isError ? (
        <div className="dashboard__state" role="alert">
          <p>Không thể tải dữ liệu analytics.</p>
          <button
            type="button"
            className="dashboard__btn dashboard__btn--primary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isFetching ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      ) : (
        <section
          className="dashboard__card"
          aria-labelledby="analytics-heading"
        >
          <h2 id="analytics-heading" className="dashboard__card-title">
            Tổng quan hiệu suất
          </h2>
          <p className="dashboard__card-desc">
            Dữ liệu được tổng hợp từ các phiên phát trực tiếp của bạn.
          </p>

          <div className="dashboard__analytics-grid">
            {stats.map((stat) => (
              <article className="dashboard__analytics-card" key={stat.label}>
                <span className="dashboard__analytics-icon" aria-hidden="true">
                  {stat.icon}
                </span>
                <strong className="dashboard__analytics-value">
                  {stat.value}
                </strong>
                <span className="dashboard__analytics-label">{stat.label}</span>
              </article>
            ))}
          </div>

          {data?.viewerHistory?.length ? (
            <div className="dashboard__chart">
              <h3>Viewers của 10 stream gần nhất</h3>
              <div
                className="dashboard__bars"
                aria-label="Biểu đồ viewers gần đây"
              >
                {data.viewerHistory.map((item, index) => {
                  const peak = Math.max(1, data.peakViewers || 0);
                  const height = Math.min(
                    100,
                    Math.max(4, (Math.max(0, item.viewers) / peak) * 100),
                  );
                  return (
                    <div
                      className="dashboard__bar-item"
                      key={`${item.date}-${index}`}
                    >
                      <div
                        className="dashboard__bar"
                        style={{ height: `${height}%` }}
                        title={`${item.viewers} viewers`}
                        role="img"
                        aria-label={`${item.date}: ${item.viewers} viewers`}
                      />
                      <span className="dashboard__bar-label">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="dashboard__empty">
              Chưa có lịch sử stream để hiển thị biểu đồ.
            </p>
          )}
        </section>
      )}
    </main>
  );
};

export default Dashboard;
