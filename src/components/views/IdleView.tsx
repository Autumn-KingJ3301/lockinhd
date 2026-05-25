import React from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../../store/useLockinStore";

export const IdleView: React.FC = () => {
  const navigate = useNavigate();
  const boards = useLockinStore((state) => state.boards);
  const lastIdleBoardId = useLockinStore((state) => state.lastIdleBoardId);
  const setActiveBoardId = useLockinStore((state) => state.setActiveBoardId);

  const lastIdleBoard = lastIdleBoardId ? boards.find(b => b.id === lastIdleBoardId) : null;

  return (
    <div className="mode-container" key="idle">
      {lastIdleBoard && (
        <div 
          className="resume-cue-banner" 
          style={{ cursor: "pointer", border: "1px solid var(--color-accent)", backgroundColor: "var(--color-accent-bg)", marginBottom: "20px" }}
          onClick={() => {
            setActiveBoardId(lastIdleBoard.id);
            navigate("/brainstorm");
          }}
        >
          <span className="resume-cue-icon">🎨</span>
          <span className="resume-cue-text">Resume Brainstorm: <strong>{lastIdleBoard.title}</strong></span>
        </div>
      )}
      <div className="empty-state">
        No active session.
        <br />
        Type above to lock in on a task, or `/add [task]` to queue it.
        <br />
        <br />
        <button 
          className="theme-toggle-btn" 
          style={{ fontSize: "11px", padding: "8px 16px" }}
          onClick={() => navigate("/brainstorm")}
        >
          Go to Infinite Canvas
        </button>
      </div>
    </div>
  );
};
