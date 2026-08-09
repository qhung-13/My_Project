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
    <aside className="admin__sidebar" aria-label="Admin navigation">
      <h2 className="admin__logo">⚙️ Admin</h2>
      {(Object.keys(TAB_ICONS) as TabType[]).map((tab) => (
        <button
          type="button"
          key={tab}
          aria-pressed={activeTab === tab}
          className={`admin__nav-btn ${activeTab === tab ? "admin__nav-btn--active" : ""}`}
          onClick={() => onTabChange(tab)}
        >
          {TAB_ICONS[tab]} {tab}
        </button>
      ))}
      <button
        type="button"
        className="admin__nav-btn"
        onClick={() => navigate("/home")}
      >
        ← Back to Site
      </button>
    </aside>
  );
};

export default AdminSidebar;
