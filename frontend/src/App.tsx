import { useState } from "react";
import Home from "./pages/Home/Home";
import Game from "./pages/Game/Game";
import Live from "./pages/Live/Live";
import "./index.css";
import Header from "./layout/Header/Header";
import { Route, Routes, Navigate } from "react-router-dom";
import Footer from "./layout/Footer/Footer";

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  return (
    <main className={darkMode ? "dark-mode" : "light-mode"}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/live" element={<Live />} />
      </Routes>

      <Footer />
    </main>
  );
}

export default App;
