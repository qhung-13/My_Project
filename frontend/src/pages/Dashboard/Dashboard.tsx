import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard">
      <h1 className="dashboard__title">📊 Dashboard</h1>

      <button
        className="dashboard__btn dashboard__btn--primary"
        onClick={() => navigate("/topup")}
      >
        💰 Nạp Xu
      </button>
    </div>
  );
};

export default Dashboard;
