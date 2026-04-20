import { useState } from "react";
import Home from "./pages/Home/Home";
import Game from "./pages/Game/Game";
import Live from "./pages/Live/Live";
import GameDetail from "./pages/Game/GameDetail";
import "./index.css";
import Header from "./layout/Header/Header";
import { Route, Routes, Navigate } from "react-router-dom";
import Footer from "./layout/Footer/Footer";
import WatchLive from "./pages/WatchLive/WatchLive";
import Profile from "./pages/Profile/Profile";

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
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
      </Routes>

      <Footer />
    </main>
  );
}

export default App;
