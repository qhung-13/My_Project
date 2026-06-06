import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useNavigate } from "react-router-dom";
import {
  useGetStatsQuery,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleBanUserMutation,
  useGetAllVideosQuery,
  useDeleteVideoMutation,
  useGetAllStreamsQuery,
} from "../../store/api/adminApi";
import type {
  AdminUser,
  AdminVideo,
  AdminStream,
  AdminStats,
} from "../../types/index";

import "./Admin.css";

type TabType = "Stats" | "Users" | "Videos" | "Streams";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("Stats");

  const { data: stats } = useGetStatsQuery(undefined) as {
    data: AdminStats | undefined;
  };
  const { data: users } = useGetAllUsersQuery(undefined) as {
    data: AdminUser[] | undefined;
  };
  const { data: videos } = useGetAllVideosQuery(undefined) as {
    data: AdminVideo[] | undefined;
  };
  const { data: streams } = useGetAllStreamsQuery(undefined) as {
    data: AdminStream[] | undefined;
  };
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [toggleBanUser] = useToggleBanUserMutation();
  const [deleteVideo] = useDeleteVideoMutation();

  // Redirect nếu không phải admin
  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleRoleChange = async (id: string, role: string) => {
    await updateUserRole({ id, role }).unwrap();
  };

  const handleBan = async (id: string) => {
    await toggleBanUser(id).unwrap();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Xóa video này?")) return;
    await deleteVideo(id).unwrap();
  };

  return (
    <div className="admin">
      <div className="admin__sidebar">
        <h2 className="admin__logo">⚙️ Admin</h2>
        {(["Stats", "Users", "Videos", "Streams"] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`admin__nav-btn ${activeTab === tab ? "admin__nav-btn--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Stats" && "📊 "}
            {tab === "Users" && "👥 "}
            {tab === "Videos" && "📹 "}
            {tab === "Streams" && "🎥 "}
            {tab}
          </button>
        ))}
        <button className="admin__nav-btn" onClick={() => navigate("/")}>
          ← Back to Site
        </button>
      </div>

      <div className="admin__content">
        {/* Stats */}
        {activeTab === "Stats" && (
          <div>
            <h2 className="admin__title">📊 Dashboard Stats</h2>
            <div className="admin__stats">
              {[
                {
                  label: "Total Users",
                  value: stats?.totalUsers || 0,
                  icon: "👥",
                },
                {
                  label: "Total Videos",
                  value: stats?.totalVideos || 0,
                  icon: "📹",
                },
                {
                  label: "Total Streams",
                  value: stats?.totalStreams || 0,
                  icon: "🎥",
                },
                {
                  label: "Total Donations",
                  value: stats?.totalDonations || 0,
                  icon: "💝",
                },
              ].map((stat) => (
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
        )}

        {/* Users */}
        {activeTab === "Users" && (
          <div>
            <h2 className="admin__title">👥 Users ({users?.length || 0})</h2>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u: AdminUser) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="admin__select"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u._id, e.target.value)
                        }
                      >
                        <option value="user">user</option>
                        <option value="streamer">streamer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={`admin__status ${u.isActive ? "admin__status--active" : "admin__status--banned"}`}
                      >
                        {u.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`admin__btn ${u.isActive ? "admin__btn--danger" : "admin__btn--success"}`}
                        onClick={() => handleBan(u._id)}
                      >
                        {u.isActive ? "Ban" : "Unban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Videos */}
        {activeTab === "Videos" && (
          <div>
            <h2 className="admin__title">📹 Videos ({videos?.length || 0})</h2>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Uploader</th>
                  <th>Category</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos?.map((v: AdminVideo) => (
                  <tr key={v._id}>
                    <td>{v.title}</td>
                    <td>{v.userId?.username}</td>
                    <td>{v.category}</td>
                    <td>{v.views}</td>
                    <td>
                      <span
                        className={`admin__status ${v.status === "public" ? "admin__status--active" : "admin__status--banned"}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin__btn admin__btn--danger"
                        onClick={() => handleDeleteVideo(v._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Streams */}
        {activeTab === "Streams" && (
          <div>
            <h2 className="admin__title">
              🎥 Streams ({streams?.length || 0})
            </h2>
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Streamer</th>
                  <th>Category</th>
                  <th>Viewers</th>
                  <th>Status</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {streams?.map((s: AdminStream) => (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>{s.userId?.username}</td>
                    <td>{s.category}</td>
                    <td>{s.viewers}</td>
                    <td>
                      <span
                        className={`admin__status ${s.isLive ? "admin__status--active" : "admin__status--banned"}`}
                      >
                        {s.isLive ? "LIVE" : "Ended"}
                      </span>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
