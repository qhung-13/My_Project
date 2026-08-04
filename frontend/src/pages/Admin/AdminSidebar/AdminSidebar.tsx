import { useNavigate } from "react-router-dom";
import type { TabType } from "../Admin";

const TAB_ICONS: Record<TabType, string> = {
  Stats: "📊",
  Users: "👥",
  Videos: "📹",
  Streams: "🎥",
};

interface AdminSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="admin__sidebar">
      <h2 className="admin__logo">⚙️ Admin</h2>
      {(Object.keys(TAB_ICONS) as TabType[]).map((tab) => (
        <button
          key={tab}
          className={`admin__nav-btn ${activeTab === tab ? "admin__nav-btn--active" : ""}`}
          onClick={() => onTabChange(tab)}
        >
          {TAB_ICONS[tab]} {tab}
        </button>
      ))}
      <button className="admin__nav-btn" onClick={() => navigate("/")}>
        ← Back to Site
      </button>
    </div>
  );
};

export default AdminSidebar;
