import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Live", path: "/live" },
];

const GAMES = ["Valorant", "League of Legends", "PUBG"];

const NavMenu = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <nav className="header__nav">
      <ul className="header__nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.path} className="header__nav-item">
            <Link to={item.path} className="header__nav-link">
              {item.label}
            </Link>
          </li>
        ))}

        <li
          className="header__nav-item header__nav-item--dropdown"
          onMouseEnter={() => setActiveMenu("games")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <span className="header__nav-link" onClick={() => navigate("/game")}>
            Games
          </span>
          {activeMenu === "games" && (
            <div className="header__dropdown">
              <ul className="header__dropdown-list">
                {GAMES.map((game) => (
                  <li key={game} className="header__dropdown-item">
                    <a href="#" className="header__dropdown-link">
                      {game}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default NavMenu;
