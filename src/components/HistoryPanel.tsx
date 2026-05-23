import React from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatSummaryDuration } from "../utils/timeFormatters";

export const HistoryPanel: React.FC = () => {
  const sessions = useLockinStore((state) => state.sessions);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);

  return (
    <div className="history-panel panel-container">
      <header className="app-header">
        <div className="app-title">HISTORY</div>
        <div className="header-status">
          <span className="session-count">{sessions.length} sessions</span>
        </div>
      </header>

      <div className="app-content">
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
                const isSelected = selectedHistorySession && (selectedHistorySession.id || selectedHistorySession.startTime) === (s.id || s.startTime);
                return (
                  <div
                    key={idx}
                    className={`queue-item ${isSelected ? "first-item" : ""}`}
                    onClick={() => setSelectedHistorySession(isSelected ? null : s)}
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
      </div>
    </div>
  );
};
