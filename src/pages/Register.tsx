import React from "react";
import { Link } from "react-router-dom";

export const Register: React.FC = () => {
  return (
    <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
      <header className="app-header" style={{ border: "none" }}>
        <div className="app-title">LOCK·IN</div>
      </header>
      
      <main className="app-content" style={{ alignItems: "center", gap: "24px" }}>
        <div className="empty-state" style={{ maxWidth: "100%" }}>
          CREATE AN ACCOUNT
        </div>
        
        <div className="hint-text" style={{ textAlign: "center", maxWidth: "240px" }}>
          FOR NOW, WE RECOMMEND USING GOOGLE LOGIN FOR THE BEST EXPERIENCE.
        </div>

        <Link 
          to="/login"
          className="queue-item first-item" 
          style={{ width: "240px", justifyContent: "center", textDecoration: "none" }}
        >
          <span className="queue-text">BACK TO LOGIN</span>
        </Link>
      </main>
    </div>
  );
};
