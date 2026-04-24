import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

interface Props {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogin: () => void;
  onRegister: () => void;
}

const MobileMenu = ({ darkMode, setDarkMode, onLogin, onRegister }: Props) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
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

        {!isAuthenticated && (
          <>
            <li className="mobile-menu__item">
              <button className="mobile-menu__link" onClick={onLogin}>
                Login
              </button>
            </li>
            <li className="mobile-menu__item">
              <button className="mobile-menu__link" onClick={onRegister}>
                Sign Up
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default MobileMenu;
