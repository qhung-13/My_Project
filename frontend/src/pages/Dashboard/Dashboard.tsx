import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useGetStreamAnalyticsQuery } from "../../store/api/streamApi";
import type { ViewerHistory } from "../../types/index";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?._id ?? "";
  const { data: analytics } = useGetStreamAnalyticsQuery(userId, {
    skip: !userId,
  });
  return (
    <div className="dashboard">
      <h1 className="dashboard__title">📊 Dashboard</h1>
      <button
        className="dashboard__btn dashboard__btn--primary"
        onClick={() => navigate("/topup")}
      >
        💰 Nạp Xu
      </button>
      <div className="dashboard__card">
        <h2 className="dashboard__card-title">📊 Stream Analytics</h2>

        <div className="dashboard__analytics-grid">
          {[
            {
              label: "Tổng streams",
              value: analytics?.totalStreams || 0,
              icon: "🎥",
            },
            {
              label: "Tổng giờ live",
              value: `${analytics?.totalHours || 0}h`,
              icon: "⏱",
            },
            {
              label: "Avg viewers",
              value: analytics?.avgViewers || 0,
              icon: "👥",
            },
            {
              label: "Peak viewers",
              value: analytics?.peakViewers || 0,
              icon: "🔝",
            },
            {
              label: "Xu nhận được",
              value: analytics?.totalCoinsReceived || 0,
              icon: "🪙",
            },
          ].map((stat) => (
            <div className="dashboard__analytics-card" key={stat.label}>
              <span className="dashboard__analytics-icon">{stat.icon}</span>
              <span className="dashboard__analytics-value">{stat.value}</span>
              <span className="dashboard__analytics-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {analytics?.viewerHistory && analytics.viewerHistory.length > 0 && (
          <div className="dashboard__chart">
            <h3>Viewers 10 stream gần nhất</h3>
            <div className="dashboard__bars">
              {analytics.viewerHistory.map(
                (item: ViewerHistory, index: number) => (
                  <div className="dashboard__bar-item" key={index}>
                    <div
                      className="dashboard__bar"
                      style={{
                        height: `${Math.max(4, (item.viewers / (analytics.peakViewers || 1)) * 100)}%`,
                      }}
                      title={`${item.viewers} viewers`}
                    />
                    <span className="dashboard__bar-label">{item.date}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
