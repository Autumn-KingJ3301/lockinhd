import React from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatSummaryDuration } from "../utils/timeFormatters";

export const SchedulesPanel: React.FC = () => {
  const schedules = useLockinStore((state) => state.schedules);
  const deleteSchedule = useLockinStore((state) => state.deleteSchedule);
  const schedulesInput = useLockinStore((state) => state.schedulesInput);
  const setSchedulesInput = useLockinStore((state) => state.setSchedulesInput);
  const addScheduleDirect = useLockinStore((state) => state.addScheduleDirect);
  const setShowRecurrenceModal = useLockinStore((state) => state.setShowRecurrenceModal);

  const sortedSchedules = [...schedules].sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));

  return (
    <div className="schedules-panel panel-container">
      <header className="app-header">
        <div className="app-title">SCHEDULED CHORES</div>
        <div className="header-status">
          <span className="session-count">{schedules.length} active</span>
        </div>
      </header>

      <div
        className="app-content"
        style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "16px" }}
      >
        <div
          className="mode-container"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          key="schedules"
        >
          <div className="section-label">Recurring & Timed</div>
          <div
            className="todo-list"
            style={{ flexGrow: 1, overflowY: "auto", marginBottom: "12px", minHeight: 0 }}
          >
            {schedules.length > 0 ? (
              sortedSchedules.map((st, idx) => (
                <div
                  key={st.id}
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
                        title={st.task}
                      >
                        {st.task}
                        {st.recurrence && <span className="badge" style={{ marginLeft: "6px", fontSize: "9px" }}>🔄 {st.recurrence.type}</span>}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
                        {new Date(st.scheduledTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {formatSummaryDuration(st.duration)} panic
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button 
                      className="delete-btn" 
                      style={{ fontSize: "12px", opacity: 0.6 }}
                      onClick={() => {
                        useLockinStore.setState({ recurrenceModalTaskId: st.id });
                        setShowRecurrenceModal(true);
                      }}
                      title="Set Recurrence"
                    >
                      📅
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteSchedule(st.id)}
                      title="Remove schedule"
                      style={{ opacity: 0.6 }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ margin: "20px auto" }}>
                No pending schedules. Log with `/sched [time] [task]`.
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
              value={schedulesInput}
              onChange={(e) => setSchedulesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addScheduleDirect();
                }
              }}
              placeholder="time task... (e.g. 5pm feed cat)"
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
              onClick={addScheduleDirect}
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
