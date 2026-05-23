import React from "react";
import { useLockinStore } from "../store/useLockinStore";

export const TasksPanel: React.FC = () => {
  const queue = useLockinStore((state) => state.queue);
  const deleteQueueItem = useLockinStore((state) => state.deleteQueueItem);
  const startSession = useLockinStore((state) => state.startSession);
  const input = useLockinStore((state) => state.input);
  const setInput = useLockinStore((state) => state.setInput);

  const handleStartTask = (task: { id: number; text: string }) => {
    deleteQueueItem(task.id);
    startSession(task.text);
  };

  return (
    <div className="tasks-panel panel-container">
      <header className="app-header">
        <div className="app-title">GLOBAL TASKS</div>
        <div className="header-status">
          <span className="session-count">{queue.length} tasks</span>
        </div>
      </header>

      <div
        className="app-content"
        style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "16px" }}
      >
        <div
          className="mode-container"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          key="tasks"
        >
          <div className="section-label">Up Next</div>
          <div
            className="todo-list"
            style={{ flexGrow: 1, overflowY: "auto", marginBottom: "12px", minHeight: 0 }}
          >
            {queue.length > 0 ? (
              queue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`todo-item ${idx === 0 ? "active-triage" : ""}`}
                  style={{ justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => handleStartTask(item)}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: 0 }}>
                    <span className="queue-index" style={{ color: "var(--color-muted)", fontSize: "11px", minWidth: "14px" }}>
                      {idx + 1}
                    </span>
                    <span
                      className="todo-text"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.text}
                    >
                      {item.text}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {idx === 0 && <span className="badge badge-start" style={{ fontSize: "9px", padding: "1px 4px" }}>↵ start</span>}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQueueItem(item.id);
                      }}
                      title="Remove task"
                      style={{ opacity: 0.6 }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ margin: "20px auto" }}>
                Queue is empty. Add tasks with `/add [task]`.
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: "0.5px solid var(--color-border)",
              paddingTop: "12px",
              display: "flex",
              gap: "6px",
            }}
          >
            <button
              className="theme-toggle-btn"
              onClick={() => {
                if (!input.startsWith("/add ")) {
                  setInput("/add ");
                }
                document.querySelector<HTMLInputElement>(".command-input")?.focus();
              }}
              style={{ fontSize: "11px", padding: "6px 10px", width: "100%" }}
            >
              + Add Task via Command
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
