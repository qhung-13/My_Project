import { useState } from "react";
import "./Leaderboard.css";

type TabType = "Viewers" | "Followers" | "Hours";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>("Viewers");

  const tabs: TabType[] = ["Viewers", "Followers", "Hours"];

  const data = {
    Viewers: [
      {
        id: 1,
        name: "TigerGaming",
        value: "8.1k",
        color: "#1877F2",
        initials: "TG",
        live: true,
      },
      {
        id: 2,
        name: "CSProVN",
        value: "5.6k",
        color: "#0F6E56",
        initials: "CS",
        live: true,
      },
      {
        id: 3,
        name: "NhokKute",
        value: "2.4k",
        color: "#E24B4A",
        initials: "NK",
        live: true,
      },
      {
        id: 4,
        name: "GalaxyX",
        value: "1.9k",
        color: "#534AB7",
        initials: "GX",
        live: false,
      },
      {
        id: 5,
        name: "ProBattle",
        value: "1.2k",
        color: "#854F0B",
        initials: "PB",
        live: true,
      },
    ],

    Followers: [
      {
        id: 1,
        name: "TigerGaming",
        value: "320k",
        color: "#1877F2",
        initials: "TG",
        live: true,
      },
      {
        id: 2,
        name: "VNGamer",
        value: "280k",
        color: "#854F0B",
        initials: "VN",
        live: false,
      },
      {
        id: 3,
        name: "SkyKing",
        value: "210k",
        color: "#534AB7",
        initials: "SK",
        live: false,
      },
      {
        id: 4,
        name: "MixGaming",
        value: "195k",
        color: "#993556",
        initials: "MX",
        live: true,
      },
      {
        id: 5,
        name: "CSProVN",
        value: "180k",
        color: "#0F6E56",
        initials: "CS",
        live: true,
      },
    ],

    Hours: [
      {
        id: 1,
        name: "VNGamer",
        value: "312h",
        color: "#854F0B",
        initials: "VN",
        live: false,
      },
      {
        id: 2,
        name: "TigerGaming",
        value: "298h",
        color: "#1877F2",
        initials: "TG",
        live: true,
      },
      {
        id: 3,
        name: "ProBattle",
        value: "245h",
        color: "#854F0B",
        initials: "PB",
        live: true,
      },
      {
        id: 4,
        name: "GalaxyX",
        value: "201h",
        color: "#534AB7",
        initials: "GX",
        live: false,
      },
      {
        id: 5,
        name: "NhokKute",
        value: "189h",
        color: "#E24B4A",
        initials: "NK",
        live: true,
      },
    ],
  };

  const currentData = data[activeTab];

  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <h2 className="leaderboard__title">Top Streamers</h2>
      </div>

      {/* Tabs */}
      <div className="leaderboard__tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="leaderboard__podium">
        {podiumOrder.map((item, index) => (
          <div key={item.id} className={`podium-item rank-${index}`}>
            {/* Medal */}
            {index === 1 && <div className="medal">👑</div>}
            {index === 0 && <div className="medal">🥈</div>}
            {index === 2 && <div className="medal">🥉</div>}

            <div className="avatar" style={{ background: item.color }}>
              {item.initials}
            </div>

            <div className="name">{item.name}</div>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="leaderboard__list">
        {rest.map((item, index) => (
          <div key={item.id} className="list-item">
            <div className="rank">{index + 4}</div>

            <div className="avatar small" style={{ background: item.color }}>
              {item.initials}
            </div>

            <div className="name">{item.name}</div>

            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
