import type { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "../store/store";

interface ProtectedRouteProps {
  children: ReactElement;
  /** When true, only users with role "admin" may pass. */
  adminOnly?: boolean;
}

/**
 * Guards a route on the client so unauthenticated users are redirected to
 * /home instead of briefly seeing a page that only renders correctly once
 * a bunch of API calls fail with 401.
 *
 * NOTE: this is a UX guard only. The backend routes (see Auth.middleware.js
 * / Admin.middleware.js) remain the actual source of truth for access
 * control and must always be trusted over this check.
 */
const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );

  if (!isAuthenticated) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
