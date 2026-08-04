import type { AdminStats, AdminUser } from "../../../types/index";

interface StatsTabProps {
  stats: AdminStats | undefined;
}

const StatsTab = ({ stats }: StatsTabProps) => {
  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥" },
    { label: "Total Videos", value: stats?.totalVideos || 0, icon: "📹" },
    { label: "Total Streams", value: stats?.totalStreams || 0, icon: "🎥" },
    { label: "Total Donations", value: stats?.totalDonations || 0, icon: "💝" },
  ];

  return (
    <div>
      <h2 className="admin__title">📊 Dashboard Stats</h2>
      <div className="admin__stats">
        {cards.map((stat) => (
          <div className="admin__stat-card" key={stat.label}>
            <span className="admin__stat-icon">{stat.icon}</span>
            <span className="admin__stat-value">{stat.value}</span>
            <span className="admin__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <h3 className="admin__subtitle">Recent Users</h3>
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
          {stats?.recentUsers?.map((u: AdminUser) => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <span className={`admin__role admin__role--${u.role}`}>
                  {u.role}
                </span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatsTab;
