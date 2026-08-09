import { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Route, Routes, Navigate, useParams } from "react-router-dom";
import { useGetProfileQuery } from "./store/api/userApi";
import {
  clearUser,
  finishAuthInitialization,
  setUser,
} from "./store/slices/authSlice";
import type { AppDispatch, RootState } from "./store/store";

import Header from "./layout/Header/Header";
import Footer from "./layout/Footer/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import "./index.css";

const Home = lazy(() => import("./pages/Home/Home"));
const Game = lazy(() => import("./pages/Game/Game"));
const GameDetail = lazy(() => import("./pages/Game/GameDetail"));
const Live = lazy(() => import("./pages/Live/Live"));
const WatchLive = lazy(() => import("./pages/WatchLive/WatchLive"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const WatchVideo = lazy(() => import("./pages/WatchVideo/WatchVideo"));
const UploadVideo = lazy(() => import("./components/UploadVideo/UploadVideo"));
const Search = lazy(() => import("./pages/Search/Search"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const TopUp = lazy(() => import("./pages/TopUp/TopUp"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const Channel = lazy(() => import("./pages/Channel/Channel"));
const AuthCallback = lazy(() => import("./pages/AuthCallback/AuthCallback"));
const CreatorLive = lazy(() => import("./pages/CreatorLive/CreatorLive"));

const PageFallback = () => (
  <div className="page-loading" role="status" aria-live="polite">
    Đang tải...
  </div>
);

const WatchLiveRoute = () => {
  const { streamId } = useParams<{ streamId: string }>();
  return <WatchLive key={streamId} />;
};

const WatchVideoRoute = () => {
  const { videoId } = useParams<{ videoId: string }>();
  return <WatchVideo key={videoId} />;
};

const OwnChannelRoute = () => {
  const userId = useSelector((state: RootState) => state.auth.user?._id);
  return userId ? (
    <Navigate to={`/channel/${userId}`} replace />
  ) : (
    <Navigate to="/home" replace />
  );
};

const NotFound = () => (
  <section className="not-found" aria-labelledby="not-found-title">
    <p className="not-found__code">404</p>
    <h1 id="not-found-title">Không tìm thấy trang</h1>
    <p>Đường dẫn này không tồn tại hoặc đã được di chuyển.</p>
    <Link className="not-found__link" to="/home">
      Về trang chủ
    </Link>
  </section>
);

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored
      ? stored === "true"
      : Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  });

  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
  } = useGetProfileQuery(undefined);

  useEffect(() => {
    if (profile) {
      dispatch(
        setUser({
          ...profile,
          coins: profile.coins ?? 0,
          role: profile.role ?? "user",
        }),
      );
      return;
    }

    if (!isLoading && !isFetching) {
      if (isError) dispatch(clearUser());
      else dispatch(finishAuthInitialization());
    }
  }, [profile, isLoading, isFetching, isError, dispatch]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    document.documentElement.classList.toggle("light-mode", !darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  return (
    <div className={darkMode ? "dark-mode" : "light-mode"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:gameId" element={<GameDetail />} />
          <Route path="/stream/:streamId" element={<WatchLiveRoute />} />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/channel/:userId" element={<Channel />} />
          <Route path="/video/:videoId" element={<WatchVideoRoute />} />
          <Route path="/search" element={<Search />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadVideo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/topup"
            element={
              <ProtectedRoute>
                <TopUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channel"
            element={
              <ProtectedRoute>
                <OwnChannelRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/live"
            element={
              <ProtectedRoute>
                <CreatorLive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;
