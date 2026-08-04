import { useState } from "react";
import useAdminData from "./hooks/useAdminData";
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import StatsTab from "./StatsTab/StatsTab";
import UsersTab from "./UsersTab/UsersTab";
import VideosTab from "./VideosTab/VideosTab";
import StreamsTab from "./StreamsTab/StreamsTab";

import "./Admin.css";

export type TabType = "Stats" | "Users" | "Videos" | "Streams";

// Access control (admin-only) is enforced by <ProtectedRoute adminOnly>
// at the route level (see App.tsx) — this component can assume it's only
// ever rendered for an authenticated admin and focus purely on rendering.
//
// This used to also `navigate("/")` during render as a second, redundant
// guard, which is a React anti-pattern (triggering a router state update
// while this component is still rendering can cause "Cannot update a
// component while rendering a different component" warnings).
const Admin = () => {
  const [activeTab, setActiveTab] = useState<TabType>("Stats");
  const {
    stats,
    users,
    videos,
    streams,
    handleRoleChange,
    handleBan,
    handleDeleteVideo,
  } = useAdminData();

  return (
    <div className="admin">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="admin__content">
        {activeTab === "Stats" && <StatsTab stats={stats} />}
        {activeTab === "Users" && (
          <UsersTab
            users={users}
            onRoleChange={handleRoleChange}
            onToggleBan={handleBan}
          />
        )}
        {activeTab === "Videos" && (
          <VideosTab videos={videos} onDelete={handleDeleteVideo} />
        )}
        {activeTab === "Streams" && <StreamsTab streams={streams} />}
      </div>
    </div>
  );
};

export default Admin;
