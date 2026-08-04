import type { AdminUser } from "../../../types/index";

interface UsersTabProps {
  users: AdminUser[] | undefined;
  onRoleChange: (id: string, role: string) => void;
  onToggleBan: (id: string) => void;
}

const UsersTab = ({ users, onRoleChange, onToggleBan }: UsersTabProps) => {
  return (
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
                  onChange={(e) => onRoleChange(u._id, e.target.value)}
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
                  onClick={() => onToggleBan(u._id)}
                >
                  {u.isActive ? "Ban" : "Unban"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTab;
