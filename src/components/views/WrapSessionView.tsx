import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import { formatTime, formatSummaryDuration } from "../../utils/timeFormatters";
import { NoteItem } from "../ui/NoteItem";
import { TodoListItem } from "../ui/TodoListItem";

export const WrapSessionView: React.FC = () => {
  const wrapData = useLockinStore((state) => state.wrapData);
  const triageSidetracks = useLockinStore((state) => state.triageSidetracks);
  const activeTriageIndex = useLockinStore((state) => state.activeTriageIndex);
  const queue = useLockinStore((state) => state.queue);

  if (!wrapData) return null;

  return (
    <div className="mode-container" key="wrap">
      <div className="wrap-header-row">
        <div className="wrap-success-indicator" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="check-icon">✓</span>
          <span>Focus Mode Lasted: {formatTime(wrapData.duration || 0)}</span>
          <span className="badge badge-revision">rev {wrapData.revision || 1}</span>
        </div>
      </div>
      <div className="wrap-task-name">{wrapData.task}</div>

      {/* ADHD Calibration & Vibe Check */}
      <div className="calibration-container" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {wrapData.estimatedDuration !== undefined && wrapData.estimatedDuration > 0 && (() => {
          const diff = (wrapData.duration || 0) - wrapData.estimatedDuration;
          const diffPercent = Math.round((diff / wrapData.estimatedDuration) * 100);
          const diffStr = diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`;
          const isAccurate = Math.abs(diffPercent) <= 10;
          const isUnder = diffPercent > 10;
          
          return (
            <div className="calibration-card" style={{ flex: 1, padding: "12px", border: "0.5px solid var(--color-border)", borderRadius: "4px", backgroundColor: "var(--color-surface)" }}>
              <div className="section-label" style={{ fontSize: "9px", marginBottom: "6px" }}>Time Calibration</div>
              <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px", color: "var(--color-muted)" }}>
                <div>Estimate: <strong style={{ color: "var(--color-text)" }}>{formatSummaryDuration(wrapData.estimatedDuration)}</strong></div>
                <div>Actual: <strong style={{ color: "var(--color-text)" }}>{formatSummaryDuration(wrapData.duration || 0)}</strong></div>
              </div>
              <div 
                className="calibration-feedback" 
                style={{ 
                  fontSize: "11px", 
                  marginTop: "8px", 
                  fontWeight: "600",
                  color: isAccurate ? "var(--color-success)" : (isUnder ? "var(--color-panic)" : "var(--color-accent)")
                }}
              >
                {isAccurate 
                  ? `Perfect calibration! (${diffStr})` 
                  : (isUnder ? `Underestimated by ${diffStr}` : `Overestimated by ${diffStr}`)}
              </div>
            </div>
          );
        })()}

        {wrapData.energyRating !== undefined && (
          <div className="energy-card" style={{ flex: 1, padding: "12px", border: "0.5px solid var(--color-border)", borderRadius: "4px", backgroundColor: "var(--color-surface)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="section-label" style={{ fontSize: "9px", marginBottom: "6px" }}>Energy Check-in</div>
              <div className="energy-stars" style={{ color: "var(--color-accent)", fontSize: "14px", letterSpacing: "1px" }}>
                {"★".repeat(wrapData.energyRating)}{"☆".repeat(5 - wrapData.energyRating)}
              </div>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--color-muted)", fontWeight: "500", marginTop: "4px" }}>
              Vibe: {wrapData.energyRating}/5
            </div>
          </div>
        )}
      </div>

      {/* Wrap-mode Sidetrack Triage */}
      {triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length ? (
        <div className="triage-card">
          <div className="triage-label">TRIAGE SIDETRACK {activeTriageIndex + 1}/{triageSidetracks.length}</div>
          <div className="triage-text">"{triageSidetracks[activeTriageIndex]}"</div>
          <div className="triage-actions">
            <span className="triage-key"><kbd>Q</kbd> queue</span>
            <span className="triage-key"><kbd>S</kbd> start next</span>
            <span className="triage-key"><kbd>D</kbd> discard</span>
            <span className="triage-key"><kbd>↵</kbd> keep in inbox</span>
          </div>
        </div>
      ) : (
        <>
          {wrapData.todos && wrapData.todos.length > 0 && (
            <div className="todos-section" style={{ marginBottom: "20px" }}>
              <div className="section-label">Session Todos</div>
              <div className="todo-list">
                {wrapData.todos.map((todo, idx) => (
                  <TodoListItem key={todo.id} todo={todo} index={idx} showTimer={false} />
                ))}
              </div>
            </div>
          )}

          {wrapData.sidetracks && wrapData.sidetracks.length > 0 && (
            <div className="todos-section" style={{ marginBottom: "20px" }}>
              <div className="section-label">Captured Sidetracks</div>
              <div className="todo-list">
                {wrapData.sidetracks.map((track, idx) => (
                  <div key={idx} className="todo-item" style={{ cursor: "default" }}>
                    <span className="todo-checkbox" style={{ color: "var(--color-muted)" }}>
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

          <div className="section-label">Session Notes</div>
          <div className="wrap-notes-section">
            {wrapData.notes.length > 0 ? (
              <div className="wrap-notes-list">
                {wrapData.notes.map((note, idx) => (
                  <NoteItem key={idx} note={note} />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ margin: "0 auto" }}>
                No notes were logged during this session.
              </div>
            )}
          </div>

          {queue.length > 0 && (
            <div className="wrap-hint-next">
              ↑ UP NEXT: <span className="wrap-hint-task">{queue[0].text}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
