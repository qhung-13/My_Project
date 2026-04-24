import { useEffect, useState } from "react";
import {
  Search,
  TvMinimalPlay,
  House,
  Gamepad2,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import Logo from "../../assets/images/Logo.png";
import Login from "../../components/Login/Login";
import Register from "../../components/Register/Register";
import CountrySelector from "./CountrySelector";
import NavMenu from "./NavMenu";
import MobileMenu from "./MobileMenu";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { clearUser } from "../../store/slices/authSlice";
import { useLogoutMutation } from "../../store/api/userApi";
import "./Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

// ============================================================
// Types
// ============================================================
interface DarkModeProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Country {
  name: string;
  flag: string;
  code: string;
}

// ============================================================
// Constants
// ============================================================
const MOBILE_NAV_ITEMS = [
  { label: "Home", path: "/home", icon: <House /> },
  { label: "Live", path: "/live", icon: <TvMinimalPlay /> },
  { label: "Game", path: "/game", icon: <Gamepad2 /> },
];

// ============================================================
// Component
// ============================================================
const Header = ({ darkMode, setDarkMode }: DarkModeProps) => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePopup, setActivePopup] = useState<"Login" | "Register" | null>(
    null,
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout(undefined).unwrap();
    dispatch(clearUser());
    setShowUserMenu(false);
    navigate("/home");
  };

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flag,cca2",
        );
        if (!res.ok) throw Error("Failed to fetch countries");
        const data = await res.json();

        const formatted: Country[] = data
          .map(
            (c: { name: { common: string }; flag: string; cca2: string }) => ({
              name: c.name.common,
              flag: c.flag,
              code: c.cca2,
            }),
          )
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(formatted);
        const vietnam = formatted.find((c: Country) => c.code === "VN");
        setSelectedCountry(vietnam || formatted[0]);
      } catch (error) {
        console.log("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <header className="header">
        <div className="container mx-auto px-4 header__container">
          {/* Logo */}
          <div className="header__logo">
            <Link to="/">
              <img src={Logo} alt="OmexLive" className="header__logo-img" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <NavMenu />

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

          {/* Country */}
          <CountrySelector
            selectedCountry={selectedCountry}
            countries={countries}
            onSelect={setSelectedCountry}
          />

          {/* Desktop Actions */}
          <div className="header__actions">
            <button className="header__btn header__btn--live">
              <TvMinimalPlay className="header__icon" />
              Go Live
            </button>

            <button
              className="header__btn-icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="header__icon" />
              ) : (
                <Moon className="header__icon" />
              )}
            </button>

            {/* Auth */}
            <div className="header__auth">
              {isAuthenticated ? (
                <div className="header__user">
                  <img
                    src={
                      user?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                    }
                    alt={user?.username}
                    className="header__avatar"
                    width={36}
                    height={36}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  />
                  {showUserMenu && (
                    <div className="header__user-menu">
                      <button
                        className="header__user-menu-item"
                        onClick={() => {
                          navigate("/profile/me");
                          setShowUserMenu(false);
                        }}
                      >
                        👤 Profile
                      </button>
                      <button
                        className="header__user-menu-item header__user-menu-item--logout"
                        onClick={handleLogout}
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    className="header__btn header__btn--outline"
                    onClick={() => setActivePopup("Login")}
                  >
                    Login
                  </button>
                  <button
                    className="header__btn header__btn--primary"
                    onClick={() => setActivePopup("Register")}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hamburger */}
          <div className="header__menu">
            <button
              className="header__menu-btn"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu className="header__icon" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <MobileMenu
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onLogin={() => setActivePopup("Login")}
            onRegister={() => setActivePopup("Register")}
          />
        )}
      </header>

      {/* Mobile Nav */}
      <div className="mobile-nav">
        <ul className="mobile-nav__list">
          {MOBILE_NAV_ITEMS.map((item) => (
            <li key={item.path} className="mobile-nav__item">
              <Link
                to={item.path}
                className={`mobile-nav__link ${pathname === item.path ? "mobile-nav__link--active" : ""}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popups */}
      {activePopup === "Login" && (
        <Login
          onClose={() => setActivePopup(null)}
          onSwitch={() => setActivePopup("Register")}
        />
      )}
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
