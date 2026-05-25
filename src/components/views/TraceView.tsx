import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import { formatSummaryDuration } from "../../utils/timeFormatters";
import { NoteItem } from "../ui/NoteItem";

export const TraceView: React.FC = () => {
  const sessions = useLockinStore((state) => state.sessions);
  const toggleTrace = useLockinStore((state) => state.toggleTrace);
  const initiateSessionSetup = useLockinStore((state) => state.initiateSessionSetup);

  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const lastRevision = lastSession?.revisionHistory?.[lastSession.revisionHistory.length - 1];
  const lastCompletedTodo = lastSession?.todos?.filter(t => t.completed).slice(-1)[0];
  const lastNote = lastRevision?.notes.slice(-1)[0] || lastSession?.notes.slice(-1)[0];

  return (
    <div className="mode-container" key="trace-inline" style={{ animation: "none" }}>
      <div className="history-detail-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="theme-toggle-btn"
            onClick={() => toggleTrace(false)}
            style={{ fontSize: "11px", padding: "2px 6px" }}
          >
            ← Dismiss Trace
          </button>
          <span className="section-label" style={{ margin: 0 }}>Memory Trace</span>
        </div>
        <div className="badge badge-revision" style={{ fontSize: "11px", background: "var(--color-accent)", color: "var(--color-bg)" }}>/trace</div>
      </div>

      <div className="task-name-large">{lastSession ? lastSession.task : "No History Found"}</div>

      {lastSession && (
        <>
          <div className="wrap-duration" style={{ fontSize: "12px", marginBottom: "20px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
            Spent {formatSummaryDuration(lastSession.duration || 0)} across {lastSession.revision || 1} revisions
          </div>

          {lastSession.resumeCue && (
            <div className="resume-cue-banner" style={{ marginBottom: "20px" }}>
              <span className="resume-cue-icon">💡</span>
              <span className="resume-cue-text">Resume Breadcrumb: {lastSession.resumeCue}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "24px" }}>
            {lastCompletedTodo && (
              <div className="todo-item" style={{ cursor: "default", opacity: 0.7, border: "0.5px dashed var(--color-border)" }}>
                <span className="todo-checkbox">[x]</span>
                <span className="todo-text completed">Last Completed: {lastCompletedTodo.text}</span>
              </div>
            )}

            {lastNote && (
              <NoteItem note={lastNote} />
            )}
          </div>

          <button 
            onClick={() => {
              initiateSessionSetup(lastSession.task, { continueSession: lastSession });
              toggleTrace(false);
            }}
            className="theme-toggle-btn"
            style={{ 
              width: "100%", 
              padding: "12px", 
              fontSize: "13px", 
              fontWeight: "bold",
              backgroundColor: "var(--color-text)",
              color: "var(--color-bg)"
            }}
          >
            Continue this Session
          </button>
        </>
      )}
    </div>
  );
};
