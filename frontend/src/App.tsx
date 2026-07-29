import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetProfileQuery } from "./store/api/userApi";
import { setUser } from "./store/slices/authSlice";
import { Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/Home/Home";
import Game from "./pages/Game/Game";
import Live from "./pages/Live/Live";
import GameDetail from "./pages/Game/GameDetail";
import Header from "./layout/Header/Header";
import Footer from "./layout/Footer/Footer";
import WatchLive from "./pages/WatchLive/WatchLive";
import Profile from "./pages/Profile/Profile";
import WatchVideo from "./pages/WatchVideo/WatchVideo";
import UploadVideo from "./components/UploadVideo/UploadVideo";
import Search from "./pages/Search/Search";
import Dashboard from "./pages/Dashboard/Dashboard";
import TopUp from "./pages/TopUp/TopUp";
import Admin from "./pages/Admin/Admin";
import Channel from "./pages/Channel/Channel";
import "./index.css";

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

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/live" element={<Live />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/:gameId" element={<GameDetail />} />
        <Route path="/stream/:streamerId" element={<WatchLive />} />
        <Route path="/profile/me" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/video/:videoId" element={<WatchVideo />} />
        <Route path="/upload" element={<UploadVideo />} />
        <Route path="/search" element={<Search />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topup" element={<TopUp />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/channel" element={<Channel />} />
      </Routes>

      <Footer />
    </main>
  );
}

export default App;
