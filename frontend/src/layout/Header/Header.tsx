import { useEffect, useRef, useState } from "react";
import {
  Search,
  TvMinimalPlay,
  Ellipsis,
  House,
  Gamepad2,
  Menu,
} from "lucide-react";
import Logo from "../../assets/images/Logo.png";
import Login from "../../components/Login/Login";
import Register from "../../components/Register/Register";
import "./Header.css";
import { Link, useLocation } from "react-router-dom";

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
const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Live", path: "/live" },
];

const GAMES = ["Valorant", "League of Legends", "PUBG"];

const MORE_ITEMS = ["Dark Mode"];

const MOBILE_NAV_ITEMS = [
  { label: "Home", path: "/home", icon: <House /> },
  { label: "Live", path: "/live", icon: <TvMinimalPlay /> },
  { label: "Game", path: "/game", icon: <Gamepad2 /> },
];

// ============================================================
// Component
// ============================================================
const Header = ({ darkMode, setDarkMode }: DarkModeProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePopup, setActivePopup] = useState<"Login" | "Register" | null>(
    null,
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");

  const { pathname } = useLocation();

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

  // Đóng country dropdown khi click ra ngoài
  useEffect(() => {
    const handleClick = () => setCountryOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // ============================================================
  // Handlers
  // ============================================================
  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setCountryOpen(false);
    setSearchCountry("");
  };

  const handleMoreAction = (item: string) => {
    if (item === "Dark Mode") setDarkMode((prev) => !prev);
  };

  // ============================================================
  // Filtered countries
  // ============================================================
  const filteredCountries = countries.filter((c) =>
    c.name
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(searchCountry.toLowerCase().replace(/\s/g, "")),
  );

  // ============================================================
  // Ref
  // ============================================================
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (dropdownRef.current) {
      dropdownRef.current.scrollTop = 0;
    }
  }, [searchCountry]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [searchCountry]);
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
          <nav className="header__nav">
            <ul className="header__nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.path} className="header__nav-item">
                  <Link to={item.path} className="header__nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Games dropdown */}
              <li
                className="header__nav-item header__nav-item--dropdown"
                onMouseEnter={() => setActiveMenu("games")}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <span className="header__nav-link">Games</span>
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
          <div className="header__country">
            <button
              className="header__country-btn"
              onClick={(e) => {
                e.stopPropagation();
                setCountryOpen(!countryOpen);
              }}
            >
              {selectedCountry ? (
                <>
                  <img
                    src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                    alt={selectedCountry.name}
                    width={20}
                    height={14}
                    style={{ borderRadius: "2px" }}
                  />
                  {selectedCountry.code}
                </>
              ) : (
                "Loading..."
              )}
            </button>

            {countryOpen && (
              <div className="header__country-dropdown" ref={dropdownRef}>
                <div className="header__country-search">
                  <input
                    type="text"
                    placeholder="Search country..."
                    className="header__country-search-input"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    value={searchCountry}
                    autoFocus
                  />
                </div>
                <div className="header__country-list" ref={listRef}>
                  {filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      className="header__country-item"
                      onClick={() => handleSelectCountry(country)}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                        alt={country.name}
                        width={20}
                        height={15}
                      />
                      {country.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="header__actions">
            <button className="header__btn header__btn--live">
              <TvMinimalPlay className="header__icon" />
              Go Live
            </button>

            {/* More dropdown */}
            <div
              className="header__more"
              onMouseEnter={() => setActiveMenu("more")}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Ellipsis className="header__icon" />
              {activeMenu === "more" && (
                <div className="header__dropdown header__dropdown--right">
                  <ul className="header__dropdown-list">
                    {MORE_ITEMS.map((item) => (
                      <li key={item} className="header__dropdown-item">
                        <button
                          className="header__dropdown-link"
                          onClick={() => handleMoreAction(item)}
                        >
                          {item === "Dark Mode"
                            ? darkMode
                              ? "Light Mode"
                              : "Dark Mode"
                            : item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Auth */}
            <div className="header__auth">
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
      </header>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="mobile-menu">
          <ul className="mobile-menu__list">
            <li className="mobile-menu__item">
              <button className="mobile-menu__link">Go Live</button>
            </li>
            <li className="mobile-menu__item">
              <button
                className="mobile-menu__link"
                onClick={() => setDarkMode((prev) => !prev)}
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
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
