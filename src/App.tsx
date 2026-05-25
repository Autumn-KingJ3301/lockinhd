import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { ThemeStore } from "./pages/ThemeStore";
import { Journal } from "./pages/Journal";
import { Brainstorm } from "./pages/Brainstorm";
import { useGlobalTheme } from "./hooks/useGlobalTheme";
import { useCloudSync } from "./hooks/useCloudSync";
import { useGlobalTimer } from "./hooks/useGlobalTimer";
import { useLockinStore } from "./store/useLockinStore";

function App() {
  useGlobalTheme();
  useCloudSync();
  useGlobalTimer();
  const rehydrateTimer = useLockinStore((state) => state.rehydrateTimer);

  useEffect(() => {
    rehydrateTimer();
    window.addEventListener("focus", rehydrateTimer);
    return () => window.removeEventListener("focus", rehydrateTimer);
  }, [rehydrateTimer]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/themes" element={<ThemeStore />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/brainstorm" element={<Brainstorm />} />
    </Routes>
  );
}

export default App;

