import Logo from "../../assets/images/Logo.png";
import Login from "../../components/Login/Login";
import Register from "../../components/Register/Register";

import {
  Search,
  TvMinimalPlay,
  Ellipsis,
  House,
  Gamepad2,
  Menu,
} from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);
  const [activePopup, setActivePopup] = useState<"Login" | "Register" | null>(
    null,
  );

  // Taking current path
  const currentPath = window.location.pathname;

  const navMobileItems = [
    { label: "Home", path: "/home", icon: <House /> },
    { label: "Live", path: "/live", icon: <TvMinimalPlay /> },
    { label: "Game", path: "/game", icon: <Gamepad2 /> },
  ];

  return (
    <>
      <header className="header">
        <div className="container mx-auto px-4 header__container">
          {/* Logo */}
          <div className="header__logo">
            <a href="/">
              <img src={Logo} alt="OmexLive" className="header__logo-img" />
            </a>
          </div>

          {/* Nav */}
          <nav className="header__nav">
            <ul className="header__nav-list">
              <li className="header__nav-item">
                <a href="#" className="header__nav-link">
                  Home
                </a>
              </li>
              <li className="header__nav-item">
                <a href="#" className="header__nav-link">
                  Live
                </a>
              </li>

              {/* Games */}
              <li
                className="header__nav-item header__nav-item--dropdown"
                onMouseEnter={() => setActiveMenu("games")}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <span className="header__nav-link">Games</span>

                {activeMenu === "games" && (
                  <div className="header__dropdown">
                    <ul className="header__dropdown-list">
                      <li className="header__dropdown-item">
                        <a href="#" className="header__dropdown-link">
                          Valorant
                        </a>
                      </li>
                      <li className="header__dropdown-item">
                        <a href="#" className="header__dropdown-link">
                          League of Legends
                        </a>
                      </li>
                      <li className="header__dropdown-item">
                        <a href="#" className="header__dropdown-link">
                          PUBG
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>

          {/* Search */}
          <div className="header__search">
            <input
              type="text"
              placeholder="Search..."
              className="header__search-input"
            />
            <button className="header__search-btn">
              <Search className="header__icon" />
            </button>
          </div>

          {/* Actions */}
          <div className="header__actions">
            {/* Go Live */}
            <button className="header__btn header__btn--live">
              <TvMinimalPlay className="header__icon" />
              Go Live
            </button>

            {/* More */}
            <div
              className="header__more"
              onMouseEnter={() => setActiveMenu("more")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Ellipsis className="header__icon" />

              {activeMenu === "more" && (
                <div className="header__dropdown header__dropdown--right">
                  <ul className="header__dropdown-list">
                    <li className="header__dropdown-item">
                      <a href="#" className="header__dropdown-link">
                        Language
                      </a>
                    </li>
                    <li className="header__dropdown-item">
                      <a href="#" className="header__dropdown-link">
                        Country
                      </a>
                    </li>
                    <li className="header__dropdown-item">
                      <a href="#" className="header__dropdown-link">
                        Dark Mode
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Auth */}
            <div className="header__auth">
              <button className="header__btn header__btn--outline">
                Login
              </button>
              <button className="header__btn header__btn--primary">
                Sign Up
              </button>
            </div>
          </div>

          <div className="header__menu">
            <button
              className="header__menu-btn"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu className="header__icon" />
            </button>
          </div>
        </div>
      </header>
      {/* Mobile dropdown menu */}
      {mobileMenu && (
        <div className="mobile-menu">
          <ul className="mobile-menu__list">
            <li className="mobile-menu__item">
              <button className="mobile-menu__link">Go live</button>
            </li>
            <li className="mobile--menu__item">
              <button className="mobile-menu__link">Language</button>
            </li>
            <li className="mobile-menu__item">
              <button className="mobile-menu__link">Country</button>
            </li>
            <li className="mobile-menu__item">
              <button className="mobile-menu__link">Dark Mode</button>
            </li>
            <li className="mobile-menu__item">
              <button
                className="mobile-menu__link"
                onClick={() => setActivePopup("Login")}
              >
                Login
              </button>
            </li>
            <li className="mobile-menu__item">
              <button
                className="mobile-menu__link"
                onClick={() => setActivePopup("Register")}
              >
                Sign Up
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <ul className="mobile-nav__list">
          {navMobileItems.map((item) => (
            <li key={item.path} className="mobile-nav__item">
              <a href={item.path} className={`mobile-nav__link ${currentPath === item.path ? "mobile-nav__link--active" : ""}`}>
                <span>{item.icon}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Show Login */}
      {activePopup === "Login" && (
        <Login
          onClose={() => setActivePopup(null)}
          onSwitch={() => setActivePopup("Register")}
        />
      )}

      {/* Show Register */}
      {activePopup === "Register" && (
        <Register
          onClose={() => setActivePopup(null)}
          onSwitch={() => setActivePopup("Login")}
        />
      )}
    </>
  );
};

export default Header;
