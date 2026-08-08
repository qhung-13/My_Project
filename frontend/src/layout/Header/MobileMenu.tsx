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
  onClose: () => void;
}

const MobileMenu = ({
  darkMode,
  setDarkMode,
  onLogin,
  onRegister,
  onClose,
}: Props) => {
  const [showGoLive, setShowGoLive] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const navigateAndClose = (path: string) => {
    navigate(path);
    onClose();
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
      navigateAndClose("/home");
    }
  };

  return (
    <div className="mobile-menu">
      <ul className="mobile-menu__list">
        <li className="mobile-menu__item">
          <button
            type="button"
            className="mobile-menu__link"
            onClick={() => {
              if (isAuthenticated) setShowGoLive(true);
              else {
                onClose();
                onLogin();
              }
            }}
          >
            Go Live
          </button>
        </li>
        <li className="mobile-menu__item mobile-menu__item--actions">
          <button
            type="button"
            className="mobile-menu__link"
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          {isAuthenticated && <NotificationBell />}
        </li>

        {isAuthenticated ? (
          <>
            <li className="mobile-menu__item">
              <button
                type="button"
                className="mobile-menu__link"
                onClick={() => navigateAndClose("/profile/me")}
              >
                👤 Profile
              </button>
            </li>
            <li className="mobile-menu__item">
              <button
                type="button"
                className="mobile-menu__link mobile-menu__link--danger"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                🚪 {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </li>
          </>
        ) : (
          <>
            <li className="mobile-menu__item">
              <button
                type="button"
                className="mobile-menu__link"
                onClick={() => {
                  onClose();
                  onLogin();
                }}
              >
                Login
              </button>
            </li>
            <li className="mobile-menu__item">
              <button
                type="button"
                className="mobile-menu__link"
                onClick={() => {
                  onClose();
                  onRegister();
                }}
              >
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
