import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import { formatSummaryDuration } from "../../utils/timeFormatters";
import { NoteItem } from "../ui/NoteItem";
import { TodoListItem } from "../ui/TodoListItem";

export const HistoryDetailView: React.FC = () => {
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const selectedRevisionIndex = useLockinStore((state) => state.selectedRevisionIndex);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  const setSelectedRevisionIndex = useLockinStore((state) => state.setSelectedRevisionIndex);
  const toggleStarSession = useLockinStore((state) => state.toggleStarSession);

  if (!selectedHistorySession) return null;

  const isViewingRevision = selectedRevisionIndex !== null && 
    selectedHistorySession.revisionHistory && 
    selectedHistorySession.revisionHistory[selectedRevisionIndex];
  
  const displayData = isViewingRevision 
    ? selectedHistorySession.revisionHistory![selectedRevisionIndex!] 
    : selectedHistorySession;

  return (
    <div className="mode-container" key="history-detail" style={{ animation: "none" }}>
      <div
        className="history-detail-header"
        style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="theme-toggle-btn"
            onClick={() => {
              setSelectedHistorySession(null);
              setSelectedRevisionIndex(null);
            }}
            style={{ fontSize: "11px", padding: "2px 6px" }}
          >
            ← Back
          </button>
          <span className="section-label" style={{ margin: 0 }}>
            {isViewingRevision ? `Revision ${(displayData as any).revisionNumber}` : "Aggregated History"}
          </span>
        </div>
        <div className="badge badge-revision" style={{ fontSize: "11px" }}>rev {selectedHistorySession.revision || 1}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%" }}>
        <div className="task-name-large" style={{ margin: 0, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {selectedHistorySession.task}
        </div>
        <button
          onClick={() => toggleStarSession(selectedHistorySession.id || selectedHistorySession.startTime)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            fontSize: "20px",
            color: selectedHistorySession.isStarred ? "var(--color-accent, #e5c158)" : "var(--color-muted)",
            transition: "transform 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="star-button-large"
          title={selectedHistorySession.isStarred ? "Unstar session" : "Star session"}
        >
          {selectedHistorySession.isStarred ? "★" : "☆"}
        </button>
      </div>

      <div className="wrap-duration" style={{ fontSize: "12px", marginBottom: "16px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
        {isViewingRevision ? "Revision Time: " : "Total Focus Time: "}
        {formatSummaryDuration(displayData.duration || 0)}
      </div>

      {displayData.todos && displayData.todos.length > 0 && (
        <div className="todos-section" style={{ marginBottom: "16px" }}>
          <div className="task-label">Todos {isViewingRevision ? "(Snapshot)" : ""}</div>
          <div className="todo-list">
            {displayData.todos.map((todo, idx) => (
              <TodoListItem key={todo.id} todo={todo} index={idx} showTimer={false} />
            ))}
          </div>
        </div>
      )}

      {displayData.sidetracks && displayData.sidetracks.length > 0 && (
        <div className="todos-section" style={{ marginBottom: "16px" }}>
          <div className="task-label">Sidetracks</div>
          <div className="todo-list">
            {displayData.sidetracks.map((track, idx) => (
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

      <hr className="content-divider" />
      <div className="section-label">{isViewingRevision ? "Revision Notes" : "All Session Notes"}</div>
      <div className="notes-feed-container" style={{ flexGrow: 1 }}>
        {displayData.notes.length > 0 ? (
          displayData.notes.map((note, idx) => (
            <NoteItem key={idx} note={note} />
          ))
        ) : (
          <div className="empty-state">No notes recorded.</div>
        )}
      </div>
    </div>
  );
};
