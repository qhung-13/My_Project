import { Suspense, lazy, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetProfileQuery } from "./store/api/userApi";
import { setUser } from "./store/slices/authSlice";
import { Route, Routes, Navigate, useParams } from "react-router-dom";

import Header from "./layout/Header/Header";
import Footer from "./layout/Footer/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import "./index.css";

// Route-level code splitting: each page is only downloaded when the user
// actually navigates to it, instead of every page (Home, Admin, Upload,
// Dashboard, ...) being bundled into the single main.js the app loads on
// first paint. This keeps the initial load fast as more pages get added.
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

const PageFallback = () => <div className="page-loading">Đang tải...</div>;

// Remount WatchLive when the streamerId param changes so all of its
// internal state (chat, socket connection, moderation selection, ...)
// resets cleanly instead of being manually reset in effects.
const WatchLiveRoute = () => {
  const { streamerId } = useParams<{ streamerId: string }>();
  return <WatchLive key={streamerId} />;
};

function App() {
  const dispatch = useDispatch();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const { data: profile } = useGetProfileQuery(undefined, {});

  useEffect(() => {
    if (profile) {
      dispatch(setUser(profile));
    }
  }, [profile, dispatch]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  return (
    <main className={darkMode ? "dark-mode" : "light-mode"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:gameId" element={<GameDetail />} />
          <Route path="/stream/:streamerId" element={<WatchLiveRoute />} />
          <Route path="/profile/me" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/video/:videoId" element={<WatchVideo />} />
          <Route path="/search" element={<Search />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Private routes: require login (see ProtectedRoute) */}
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
                <Channel />
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
        </Routes>
      </Suspense>

      <Footer />
    </main>
  );
}

export default App;
