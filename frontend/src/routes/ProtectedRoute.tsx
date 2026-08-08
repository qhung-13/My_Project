import type { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "../store/store";

interface ProtectedRouteProps {
  children: ReactElement;
  adminOnly?: boolean;
}

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );

  // Undefined is treated as initialized for backward-compatible preloaded test
  // states; the real store always starts with false.
  if (isInitialized === false) {
    return (
      <div className="page-loading" role="status">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
