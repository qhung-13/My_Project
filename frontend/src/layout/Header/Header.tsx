import { useCallback, useEffect, useState } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import {
  Search,
  TvMinimalPlay,
  House,
  Gamepad2,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Logo from "../../assets/images/Logo.png";
import Login from "../../components/Login/Login";
import Register from "../../components/Register/Register";
import GoLiveModal from "../../components/GoLiveModal/GoLiveModal";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import CountrySelector from "./CountrySelector";
import NavMenu from "./NavMenu";
import MobileMenu from "./MobileMenu";
import type { RootState, AppDispatch } from "../../store/store";
import { clearUser } from "../../store/slices/authSlice";
import { useLogoutMutation } from "../../store/api/userApi";
import "./Header.css";

interface DarkModeProps {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
}

interface Country {
  name: string;
  flag: string;
  code: string;
}

const DEFAULT_COUNTRY: Country = { name: "Vietnam", flag: "🇻🇳", code: "VN" };
const FALLBACK_COUNTRIES: Country[] = [
  DEFAULT_COUNTRY,
  { name: "United States", flag: "🇺🇸", code: "US" },
];

const MOBILE_NAV_ITEMS = [
  { label: "Home", path: "/home", icon: <House aria-hidden="true" /> },
  { label: "Live", path: "/live", icon: <TvMinimalPlay aria-hidden="true" /> },
  { label: "Game", path: "/game", icon: <Gamepad2 aria-hidden="true" /> },
];

const Header = ({ darkMode, setDarkMode }: DarkModeProps) => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePopup, setActivePopup] = useState<"Login" | "Register" | null>(
    null,
  );
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(DEFAULT_COUNTRY);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGoLive, setShowGoLive] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const submitSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?${new URLSearchParams({ q: query }).toString()}`);
    setSearchQuery("");
  }, [navigate, searchQuery]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") submitSearch();
  };

  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
    } catch (error) {
      console.error(
        "Logout request failed; clearing local session anyway.",
        error,
      );
    } finally {
      dispatch(clearUser());
      setShowUserMenu(false);
      navigate("/home");
    }
  };

  const handleGoLive = () => {
    if (!isAuthenticated) {
      setActivePopup("Login");
      return;
    }
    setShowGoLive(true);
  };

  useEffect(() => {
    setMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flag,cca2",
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Failed to fetch countries");
        const data: Array<{
          name: { common: string };
          flag: string;
          cca2: string;
        }> = await response.json();
        const formatted = data
          .map((country) => ({
            name: country.name.common,
            flag: country.flag,
            code: country.cca2,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (formatted.length > 0) {
          setCountries(formatted);
          setSelectedCountry(
            formatted.find((country) => country.code === "VN") ??
              formatted[0] ??
              DEFAULT_COUNTRY,
          );
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn(
            "Country list unavailable; using local fallback.",
            error,
          );
        }
      }
    };

    void fetchCountries();
    return () => controller.abort();
  }, []);

  return (
    <>
      <header className="header">
        <div className="container mx-auto px-4 header__container">
          <div className="header__logo">
            <Link to="/home" aria-label="OmexLive home">
              <img src={Logo} alt="OmexLive" className="header__logo-img" />
            </Link>
          </div>

          <NavMenu />

          <div className="header__search" role="search">
            <label className="sr-only" htmlFor="site-search">
              Search streams and videos
            </label>
            <input
              id="site-search"
              type="search"
              placeholder="Search..."
              className="header__search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              maxLength={100}
            />
            <button
              type="button"
              className="header__search-btn"
              onClick={submitSearch}
              aria-label="Search"
              disabled={!searchQuery.trim()}
            >
              <Search className="header__icon" aria-hidden="true" />
            </button>
          </div>

          <CountrySelector
            selectedCountry={selectedCountry}
            countries={countries}
            onSelect={setSelectedCountry}
          />

          <div className="header__actions">
            <button
              type="button"
              className="header__btn header__btn--live"
              onClick={handleGoLive}
            >
              <TvMinimalPlay className="header__icon" aria-hidden="true" />
              Go Live
            </button>

            <button
              type="button"
              className="header__btn-icon"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={
                darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"
              }
              title={
                darkMode ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"
              }
            >
              {darkMode ? (
                <Sun className="header__icon" aria-hidden="true" />
              ) : (
                <Moon className="header__icon" aria-hidden="true" />
              )}
            </button>

            {isAuthenticated && <NotificationBell />}

            <div className="header__auth">
              {isAuthenticated ? (
                <div className="header__user">
                  <button
                    type="button"
                    className="header__avatar-button"
                    onClick={() => setShowUserMenu((current) => !current)}
                    aria-label="Mở menu tài khoản"
                    aria-expanded={showUserMenu}
                  >
                    <img
                      src={
                        user?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username ?? "User")}`
                      }
                      alt=""
                      className="header__avatar"
                      width={36}
                      height={36}
                    />
                  </button>
                  {showUserMenu && (
                    <div className="header__user-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="header__user-menu-item"
                        onClick={() => navigate("/profile/me")}
                      >
                        👤 Profile
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="header__user-menu-item"
                        onClick={() => navigate("/channel")}
                      >
                        📺 My channel
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="header__user-menu-item"
                        onClick={() => navigate("/topup")}
                      >
                        💰 Nạp Xu ({user?.coins ?? 0})
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="header__user-menu-item header__user-menu-item--logout"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        🚪 {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="header__btn header__btn--outline"
                    onClick={() => setActivePopup("Login")}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="header__btn header__btn--primary"
                    onClick={() => setActivePopup("Register")}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="header__menu">
            <button
              type="button"
              className="header__menu-btn"
              onClick={() => setMobileMenu((current) => !current)}
              aria-label="Mở menu"
              aria-expanded={mobileMenu}
            >
              <Menu className="header__icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        {mobileMenu && (
          <MobileMenu
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onLogin={() => setActivePopup("Login")}
            onRegister={() => setActivePopup("Register")}
            onClose={() => setMobileMenu(false)}
          />
        )}
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <ul className="mobile-nav__list">
          {MOBILE_NAV_ITEMS.map((item) => (
            <li key={item.path} className="mobile-nav__item">
              <Link
                to={item.path}
                className={`mobile-nav__link ${pathname === item.path ? "mobile-nav__link--active" : ""}`}
                aria-current={pathname === item.path ? "page" : undefined}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

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
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}
    </>
  );
};

export default Header;
