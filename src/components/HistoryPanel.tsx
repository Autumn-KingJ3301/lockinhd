import React, { useState } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatSummaryDuration } from "../utils/timeFormatters";

export const HistoryPanel: React.FC = () => {
  const sessions = useLockinStore((state) => state.sessions);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  const toggleStarSession = useLockinStore((state) => state.toggleStarSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  let filteredSessions = sessions.filter((s) =>
    s.task.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showStarredOnly) {
    filteredSessions = filteredSessions.filter((s) => s.isStarred);
  }

  return (
    <div className="history-panel panel-container">
      <header className="app-header">
        <div className="app-title">HISTORY</div>
        <div className="header-status">
          <span className="session-count">
            {searchQuery || showStarredOnly ? `${filteredSessions.length} of ` : ""}
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Panel Search Bar */}
      <div className="panel-search-wrapper" style={{ display: "flex", gap: "8px" }}>
        <div style={{ position: "relative", flexGrow: 1, display: "flex", alignItems: "center" }}>
          <span className="panel-search-icon">🔍</span>
          <input
            type="text"
            className="panel-search-input"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
              }
            }}
          />
          {searchQuery && (
            <button
              className="panel-search-clear"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className="star-filter-btn"
          style={{
            background: showStarredOnly ? "var(--color-accent-bg, rgba(229, 193, 88, 0.15))" : "var(--color-surface)",
            border: `0.5px solid ${showStarredOnly ? "var(--color-accent)" : "var(--color-border)"}`,
            color: showStarredOnly ? "var(--color-accent)" : "var(--color-muted)",
            borderRadius: "4px",
            padding: "6px 8px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            width: "32px",
            height: "28px"
          }}
          title={showStarredOnly ? "Show all sessions" : "Show starred only"}
        >
          {showStarredOnly ? "★" : "☆"}
        </button>
      </div>

      <div className="app-content">
        <div className="mode-container" key="history-list">
          <div className="section-label">Completed Sessions</div>
          {filteredSessions.length > 0 ? (
            <div className="queue-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredSessions.map((s, idx) => {
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
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
                        {s.task}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarSession(s.id || s.startTime);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px",
                            fontSize: "14px",
                            color: s.isStarred ? "var(--color-accent, #e5c158)" : "var(--color-muted)",
                            transition: "transform 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          className="star-button"
                          title={s.isStarred ? "Unstar session" : "Star session"}
                        >
                          {s.isStarred ? "★" : "☆"}
                        </button>
                        <span className="badge badge-revision">
                          rev {s.revision || 1}
                        </span>
                      </div>
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
            <div className="empty-state">
              {searchQuery || showStarredOnly ? "No matching sessions found." : "No sessions completed today."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

