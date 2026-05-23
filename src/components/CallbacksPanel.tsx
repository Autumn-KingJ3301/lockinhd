import React from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatSummaryDuration } from "../utils/timeFormatters";

export const CallbacksPanel: React.FC = () => {
  const callbacks = useLockinStore((state) => state.callbacks);
  const deleteCallback = useLockinStore((state) => state.deleteCallback);
  const callbacksInput = useLockinStore((state) => state.callbacksInput);
  const setCallbacksInput = useLockinStore((state) => state.setCallbacksInput);
  const addCallbackDirect = useLockinStore((state) => state.addCallbackDirect);

  return (
    <div className="callbacks-panel panel-container">
      <header className="app-header">
        <div className="app-title">CALLBACK CHORES</div>
        <div className="header-status">
          <span className="session-count">{callbacks.length} pending</span>
        </div>
      </header>

      <div
        className="app-content"
        style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "16px" }}
      >
        <div
          className="mode-container"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          key="callbacks"
        >
          <div className="section-label">Run after session</div>
          <div
            className="todo-list"
            style={{ flexGrow: 1, overflowY: "auto", marginBottom: "12px", minHeight: 0 }}
          >
            {callbacks.length > 0 ? (
              callbacks.map((cb, idx) => (
                <div
                  key={cb.id}
                  className="todo-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0 }}>
                    <span className="queue-index" style={{ color: "var(--color-muted)", fontSize: "11px", minWidth: "14px" }}>
                      {idx + 1}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span
                        className="todo-text"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={cb.task}
                      >
                        {cb.task}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
                        {formatSummaryDuration(cb.duration)} panic
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteCallback(cb.id)}
                    title="Remove callback"
                    style={{ opacity: 0.6 }}
                  >
                    &times;
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ margin: "20px auto" }}>
                No pending callbacks. Log with `/cb [task]`.
              </div>
            )}
          </div>

          {/* Quick Add */}
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
              value={callbacksInput}
              onChange={(e) => setCallbacksInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCallbackDirect();
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
              onClick={addCallbackDirect}
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
