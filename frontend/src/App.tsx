import { useState } from "react";
import Home from "./pages/Home";
import "./index.css"

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  return (
    <>
      <main className={darkMode ? "dark-mode" : "light-mode"}>
        <Home darkMode={darkMode} setDarkMode={setDarkMode} />
      </main>
    </>
  );
}

export default App;
