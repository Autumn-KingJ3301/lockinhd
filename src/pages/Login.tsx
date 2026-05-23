import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export const Login: React.FC = () => {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <header className="app-header" style={{ border: "none" }}>
        <div className="app-title">LOCK·IN</div>
      </header>
      
      <main className="app-content" style={{ alignItems: "center", gap: "24px" }}>
        <div className="empty-state" style={{ maxWidth: "100%" }}>
          LOG IN TO SYNC YOUR SESSIONS
        </div>
        
        <button 
          className="queue-item first-item" 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ width: "240px", justifyContent: "center" }}
        >
          <span className="queue-text">LOG IN WITH GOOGLE</span>
        </button>

        <div className="hint-text">
          DON'T HAVE AN ACCOUNT? <Link to="/register" style={{ color: "var(--color-accent)" }}>REGISTER</Link>
        </div>
      </main>
    </div>
  );
};
