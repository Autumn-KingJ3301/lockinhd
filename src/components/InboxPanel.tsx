import React from "react";
import { useLockinStore } from "../store/useLockinStore";

export const InboxPanel: React.FC = () => {
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const deleteIdleSidetrack = useLockinStore((state) => state.deleteIdleSidetrack);
  const inboxInput = useLockinStore((state) => state.inboxInput);
  const setInboxInput = useLockinStore((state) => state.setInboxInput);
  const addIdleSidetrackDirect = useLockinStore((state) => state.addIdleSidetrackDirect);
  const startSessionFromSidetrack = useLockinStore((state) => state.startSessionFromSidetrack);

  return (
    <div className="inbox-panel panel-container">
      <header className="app-header">
        <div className="app-title">BRAINDUMP INBOX</div>
        <div className="header-status">
          <span className="session-count">{idleSidetracks.length} ideas</span>
        </div>
      </header>

      <div
        className="app-content"
        style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "16px" }}
      >
        <div
          className="mode-container"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          key="inbox"
        >
          <div className="section-label">Jumping Ideas</div>
          <div
            className="todo-list"
            style={{ flexGrow: 1, overflowY: "auto", marginBottom: "12px", minHeight: 0 }}
          >
            {idleSidetracks.length > 0 ? (
              idleSidetracks.map((track, idx) => (
                <div
                  key={idx}
                  className="todo-item"
                  style={{ justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => startSessionFromSidetrack(idx)}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0 }}>
                    <span className="todo-checkbox" style={{ color: "var(--color-muted)" }}>
                      💡
                    </span>
                    <span
                      className="todo-text"
                      style={{
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={track}
                    >
                      {track}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteIdleSidetrack(idx);
                    }}
                    title="Remove sidetrack"
                    style={{ opacity: 0.6 }}
                  >
                    &times;
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ margin: "20px auto" }}>
                Inbox is empty. Log ideas with `/s [idea]` or type below.
              </div>
            )}
          </div>

          {/* Inbox Quick Add */}
          <div
            style={{
              borderTop: "0.5px solid var(--color-border)",
              paddingTop: "12px",
              display: "flex",
              gap: "6px",
            }}
          >
            <input
              type="text"
              className="command-input"
              value={inboxInput}
              onChange={(e) => setInboxInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addIdleSidetrackDirect();
                }
              }}
              placeholder="quick capture..."
              style={{
                fontSize: "13px",
                padding: "6px 8px",
                border: "0.5px solid var(--color-border)",
                borderRadius: "2px",
                backgroundColor: "var(--color-bg)",
                width: "100%",
              }}
            />
            <button
              className="theme-toggle-btn"
              onClick={addIdleSidetrackDirect}
              style={{ fontSize: "11px", padding: "6px 10px" }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
