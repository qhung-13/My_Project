import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import type { RootState, AppDispatch } from "../../store/store";
import { clearUser } from "../../store/slices/authSlice";
import { useLogoutMutation } from "../../store/api/userApi";
import GoLiveModal from "../../components/GoLiveModal/GoLiveModal";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell/NotificationBell";

interface Props {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogin: () => void;
  onRegister: () => void;
}

const MobileMenu = ({ darkMode, setDarkMode, onLogin, onRegister }: Props) => {
  const [showGoLive, setShowGoLive] = useState(false);
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
          <button
            className="mobile-menu__link"
            onClick={() => setShowGoLive(true)}
          >
            Go Live
          </button>
        </li>
        <li className="mobile-menu__item">
          <button
            className="mobile-menu__link"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {isAuthenticated && <NotificationBell />}
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
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}
    </div>
  );
};

export default MobileMenu;
