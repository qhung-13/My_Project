import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { clearUser } from "../../store/slices/authSlice";
import { useLogoutMutation } from "../../store/api/userApi";
import { useNavigate } from "react-router-dom";

interface Props {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogin: () => void;
  onRegister: () => void;
}

const MobileMenu = ({ darkMode, setDarkMode, onLogin, onRegister }: Props) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout(undefined).unwrap();
    dispatch(clearUser());
  };

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

        {isAuthenticated ? (
          <>
            <li className="mobile-menu__item">
              <button
                className="mobile-menu__link"
                onClick={() => navigate("/profile/me")}
              >
                👤 Profile
              </button>
            </li>
            <li className="mobile-menu__item">
              <button
                className="mobile-menu__link"
                style={{ color: "#ef4444" }}
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </li>
          </>
        ) : (
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
