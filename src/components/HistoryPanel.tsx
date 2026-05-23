import React from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatSummaryDuration, formatTimestamp } from "../utils/timeFormatters";

export const HistoryPanel: React.FC = () => {
  const sessions = useLockinStore((state) => state.sessions);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  const continueSession = useLockinStore((state) => state.continueSession);

  return (
    <div className="history-panel panel-container">
      <header className="app-header">
        <div className="app-title">HISTORY</div>
        <div className="header-status">
          <span className="session-count">{sessions.length} sessions</span>
        </div>
      </header>

      <div className="app-content">
        {selectedHistorySession ? (
          <div className="mode-container" key="history-detail">
            <div
              className="history-detail-header"
              style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="theme-toggle-btn"
                  onClick={() => setSelectedHistorySession(null)}
                  style={{ fontSize: "11px", padding: "2px 6px" }}
                >
                  ← Back
                </button>
                <span className="section-label" style={{ margin: 0 }}>
                  Session Detail
                </span>
              </div>
              <button
                className="theme-toggle-btn"
                onClick={() => continueSession(selectedHistorySession)}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  backgroundColor: "var(--color-accent)",
                  borderColor: "var(--color-accent-border)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue ↵
              </button>
            </div>

            <div className="wrap-task-name" style={{ fontSize: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{selectedHistorySession.task}</span>
              <span className="badge badge-revision" style={{ fontSize: "11px" }}>rev {selectedHistorySession.revision || 1}</span>
            </div>

            <div className="wrap-duration" style={{ fontSize: "12px", marginBottom: "16px" }}>
              Focus Time: {formatSummaryDuration(selectedHistorySession.duration || 0)}
            </div>

            {selectedHistorySession.todos && selectedHistorySession.todos.length > 0 && (
              <div className="todos-section" style={{ marginBottom: "16px" }}>
                <div className="task-label">Todos</div>
                <div className="todo-list">
                  {selectedHistorySession.todos.map((todo) => (
                    <div key={todo.id} className="todo-item" style={{ cursor: "default" }}>
                      <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                      <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedHistorySession.sidetracks && selectedHistorySession.sidetracks.length > 0 && (
              <div className="todos-section" style={{ marginBottom: "16px" }}>
                <div className="task-label">Sidetracks</div>
                <div className="todo-list">
                  {selectedHistorySession.sidetracks.map((track, idx) => (
                    <div key={idx} className="todo-item" style={{ cursor: "default" }}>
                      <span className="todo-checkbox" style={{ color: "var(--color-accent)" }}>
                        💡
                      </span>
                      <span className="todo-text" style={{ fontStyle: "italic" }}>
                        {track}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="section-label">Notes</div>
            <div className="wrap-notes-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedHistorySession.notes.length > 0 ? (
                selectedHistorySession.notes.map((note, idx) => (
                  <div key={idx} className="note-item">
                    <span className="note-time">{formatTimestamp(note.ts)}</span>
                    <span className="note-text">{note.text}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No notes recorded.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="mode-container" key="history-list">
            <div className="section-label">Completed Sessions</div>
            {sessions.length > 0 ? (
              <div className="queue-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sessions.map((s, idx) => {
                  const completionTime = s.endTime
                    ? new Date(s.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <div
                      key={idx}
                      className="queue-item"
                      onClick={() => setSelectedHistorySession(s)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "4px",
                      }}
                    >
                      <div className="queue-text" style={{ fontWeight: 600, fontSize: "13px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.task}
                        </span>
                        <span className="badge badge-revision" style={{ flexShrink: 0, marginLeft: "8px" }}>
                          rev {s.revision || 1}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          fontSize: "11px",
                          color: "var(--color-muted)",
                        }}
                      >
                        <span>{formatSummaryDuration(s.duration || 0)}</span>
                        <span>{completionTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No sessions completed today.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
