import type { AdminStats } from "../../../types/index";
import { formatViewers } from "../../../utils/format";

interface StatsTabProps {
  stats: AdminStats | undefined;
}

const safeDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
};

const StatsTab = ({ stats }: StatsTabProps) => {
  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥" },
    { label: "Total Videos", value: stats?.totalVideos ?? 0, icon: "📹" },
    { label: "Total Streams", value: stats?.totalStreams ?? 0, icon: "🎥" },
    { label: "Total Donations", value: stats?.totalDonations ?? 0, icon: "💝" },
  ];

  return (
    <section>
      <h2 className="admin__title">Dashboard Stats</h2>
      <div className="admin__stats">
        {cards.map((stat) => (
          <div className="admin__stat-card" key={stat.label}>
            <span className="admin__stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
            <span className="admin__stat-value">
              {formatViewers(stat.value)}
            </span>
            <span className="admin__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <h3 className="admin__subtitle">Recent Users</h3>
      <div className="admin__table-wrap">
        <table className="admin__table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentUsers?.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`admin__role admin__role--${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{safeDate(user.createdAt)}</td>
              </tr>
            ))}
            {stats?.recentUsers?.length === 0 && (
              <tr>
                <td colSpan={4} className="admin__empty">
                  Chưa có người dùng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StatsTab;
