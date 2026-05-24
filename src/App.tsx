import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { ThemeStore } from "./pages/ThemeStore";
import { useGlobalTheme } from "./hooks/useGlobalTheme";

function App() {
  useGlobalTheme();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/themes" element={<ThemeStore />} />
    </Routes>
  );
}

export default App;
