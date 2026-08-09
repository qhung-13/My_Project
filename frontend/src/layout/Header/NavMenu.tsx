import { Link } from "react-router-dom";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Live", path: "/live" },
];

const GAMES = ["Valorant", "League of Legends", "PUBG"];

const NavMenu = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
          <Link className="header__nav-link" to="/game">
            Games
          </Link>
          {activeMenu === "games" && (
            <div className="header__dropdown">
              <ul className="header__dropdown-list">
                {GAMES.map((game) => (
                  <li key={game} className="header__dropdown-item">
                    <Link
                      to={`/game/${encodeURIComponent(game)}`}
                      className="header__dropdown-link"
                    >
                      {game}
                    </Link>
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
