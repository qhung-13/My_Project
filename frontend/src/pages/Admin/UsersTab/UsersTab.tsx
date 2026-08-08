import type { AdminUser } from "../../../types/index";

interface UsersTabProps {
  users: AdminUser[] | undefined;
  currentUserId?: string;
  pendingAction: string | null;
  onRoleChange: (id: string, role: string) => Promise<void>;
  onToggleBan: (id: string) => Promise<void>;
}

const UsersTab = ({
  users,
  currentUserId,
  pendingAction,
  onRoleChange,
  onToggleBan,
}: UsersTabProps) => (
  <section>
    <h2 className="admin__title">Users ({users?.length ?? 0})</h2>
    <div className="admin__table-wrap">
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
          {users?.map((user) => {
            const isSelf = user._id === currentUserId;
            const isRolePending = pendingAction === `role:${user._id}`;
            const isBanPending = pendingAction === `ban:${user._id}`;
            return (
              <tr key={user._id}>
                <td>
                  {user.username}
                  {isSelf ? " (bạn)" : ""}
                </td>
                <td>{user.email}</td>
                <td>
                  <label className="sr-only" htmlFor={`role-${user._id}`}>
                    Role của {user.username}
                  </label>
                  <select
                    id={`role-${user._id}`}
                    className="admin__select"
                    value={user.role === "stream" ? "streamer" : user.role}
                    disabled={isSelf || isRolePending}
                    onChange={(event) =>
                      void onRoleChange(user._id, event.target.value)
                    }
                  >
                    <option value="user">user</option>
                    <option value="streamer">streamer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span
                    className={`admin__status ${user.isActive ? "admin__status--active" : "admin__status--banned"}`}
                  >
                    {user.isActive ? "Active" : "Banned"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={`admin__btn ${user.isActive ? "admin__btn--danger" : "admin__btn--success"}`}
                    onClick={() => void onToggleBan(user._id)}
                    disabled={isSelf || isBanPending}
                    title={
                      isSelf
                        ? "Bạn không thể khóa tài khoản của chính mình"
                        : undefined
                    }
                  >
                    {isBanPending
                      ? "Đang xử lý..."
                      : user.isActive
                        ? "Ban"
                        : "Unban"}
                  </button>
                </td>
              </tr>
            );
          })}
          {users?.length === 0 && (
            <tr>
              <td colSpan={5} className="admin__empty">
                Không có người dùng.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default UsersTab;
