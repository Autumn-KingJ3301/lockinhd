import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="empty-state">NOT LOGGED IN</div>
        <button className="queue-item first-item" onClick={() => navigate("/login")}>
          <span className="queue-text">GO TO LOGIN</span>
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">USER PROFILE</div>
        <button className="delete-btn" onClick={() => navigate("/")} title="Back to App">×</button>
      </header>
      
      <main className="app-content" style={{ gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--color-accent)" }} 
            />
          ) : (
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--color-surface)", display: "flex", alignItems: "center", justifyItems: "center", fontSize: "32px" }}>
              👤
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div className="task-name-large" style={{ marginBottom: "4px" }}>{user.displayName || "Anonymous User"}</div>
            <div className="hint-text">{user.email}</div>
          </div>
        </div>

        <div className="todos-section">
          <div className="task-label">ACCOUNT INFO</div>
          <div className="todo-list">
            <div className="todo-item" style={{ cursor: "default" }}>
              <span className="todo-checkbox">[ID]</span>
              <span className="todo-text">{user.uid}</span>
            </div>
            <div className="todo-item" style={{ cursor: "default" }}>
              <span className="todo-checkbox">[PR]</span>
              <span className="todo-text">Provider: {user.providerData[0]?.providerId || "firebase"}</span>
            </div>
          </div>
        </div>

        <hr className="content-divider" />

        <button 
          className="queue-item" 
          onClick={handleLogout}
          style={{ marginTop: "auto", borderColor: "var(--color-muted)" }}
        >
          <div className="queue-item-left">
            <span className="queue-text" style={{ color: "var(--color-muted)" }}>LOG OUT</span>
          </div>
        </button>
      </main>
    </div>
  );
};
