import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import StatsTab from "./StatsTab/StatsTab";
import StreamsTab from "./StreamsTab/StreamsTab";
import UsersTab from "./UsersTab/UsersTab";
import VideosTab from "./VideosTab/VideosTab";
import useAdminData from "./hooks/useAdminData";
import "./Admin.css";

export type TabType = "Stats" | "Users" | "Videos" | "Streams";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<TabType>("Stats");
  const currentUserId = useSelector((state: RootState) => state.auth.user?._id);
  const {
    stats,
    users,
    videos,
    streams,
    isLoading,
    queryError,
    actionError,
    pendingAction,
    refetchAll,
    handleRoleChange,
    handleBan,
    handleDeleteVideo,
    handleEndStream,
  } = useAdminData();

  return (
    <div className="admin">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="admin__content">
        {queryError && (
          <div className="admin__notice admin__notice--error" role="alert">
            <span>Không thể tải đầy đủ dữ liệu quản trị.</span>
            <button type="button" onClick={refetchAll}>
              Thử lại
            </button>
          </div>
        )}
        {actionError && (
          <div className="admin__notice admin__notice--error" role="alert">
            {actionError}
          </div>
        )}
        {isLoading && (
          <div className="admin__loading" role="status">
            Đang tải dữ liệu...
          </div>
        )}

        {activeTab === "Stats" && <StatsTab stats={stats} />}
        {activeTab === "Users" && (
          <UsersTab
            users={users}
            currentUserId={currentUserId}
            pendingAction={pendingAction}
            onRoleChange={handleRoleChange}
            onToggleBan={handleBan}
          />
        )}
        {activeTab === "Videos" && (
          <VideosTab
            videos={videos}
            pendingAction={pendingAction}
            onDelete={handleDeleteVideo}
          />
        )}
        {activeTab === "Streams" && (
          <StreamsTab
            streams={streams}
            pendingAction={pendingAction}
            onEndStream={handleEndStream}
          />
        )}
      </main>
    </div>
  );
};

export default Admin;
