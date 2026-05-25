import React, { useState } from "react";
import { useLockinStore } from "../../store/useLockinStore";
import { formatPanicTime } from "../../utils/timeFormatters";
import { NoteItem } from "../ui/NoteItem";
import { TodoListItem } from "../ui/TodoListItem";

export const ActiveSessionView: React.FC<{ notesEndRef: React.RefObject<HTMLDivElement | null> }> = ({ notesEndRef }) => {
  const [activeTab, setActiveTab] = useState<"todos" | "notes">("todos");
  const session = useLockinStore((state) => state.session);
  const elapsed = useLockinStore((state) => state.elapsed);
  const soundEnabled = useLockinStore((state) => state.soundEnabled);
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);

  if (!session) return null;

  return (
    <div className="mode-container" key="active">
      <div className="task-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>WORKING ON</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="badge badge-revision">rev {session.revision || 1}</span>
          <span 
            className="badge" 
            style={{ 
              color: soundEnabled ? "var(--color-accent)" : "var(--color-muted)", 
              border: "0.5px solid var(--color-border)", 
              background: "var(--color-surface)", 
              fontSize: "9px", 
              cursor: "pointer" 
            }} 
            title={soundEnabled ? "Sound on (/sound to toggle)" : "Sound off (/sound to toggle)"} 
            onClick={() => setToastMsg(soundEnabled ? "Sound on. Use /sound to toggle." : "Sound off. Use /sound to toggle.")}
          >
            {soundEnabled ? "♪" : "♪̶"}
          </span>
        </div>
      </div>
      <div className="task-name-large">{session.task}</div>

      {/* Session Timer Banner */}
      {session.timerEndElapsed !== undefined && (
        <div className={`panic-banner ${session.timerEndElapsed - elapsed <= 15 ? "panic-critical" : ""}`}>
          <span className="panic-banner-icon">⏳</span>
          <span className="panic-banner-text">
            {session.timerEndElapsed - elapsed > 0 ? (
              <>Session timer: <strong>{formatPanicTime(session.timerEndElapsed - elapsed)}</strong></>
            ) : (
              <>Timer expired! Overtime: <strong style={{ color: "var(--color-panic)" }}>{formatPanicTime(session.timerEndElapsed - elapsed)}</strong></>
            )}
          </span>
        </div>
      )}

      {/* Resume Cue Banner */}
      {session.resumeCue && (
        <div className="resume-cue-banner">
          <span className="resume-cue-icon">💡</span>
          <span className="resume-cue-text">Resume here: {session.resumeCue}</span>
        </div>
      )}

      {/* Tab Selector Styles */}
      <style>{`
        .session-tabs {
          display: flex;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
          margin: 16px 0;
          gap: 4px;
        }

        .session-tab-btn {
          background: none;
          border: none;
          padding: 6px 12px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-muted);
          cursor: pointer;
          border-radius: 6px 6px 0 0;
          transition: all 0.2s;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-bottom: 2px solid transparent;
        }

        .session-tab-btn:hover {
          color: var(--color-text);
        }

        .session-tab-btn.active {
          color: var(--color-accent);
          border-bottom-color: var(--color-accent);
        }
      `}</style>

      {/* Tab Selector Header */}
      <div className="session-tabs">
        <button 
          className={`session-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          ☑ Subtasks ({session.todos?.length || 0})
        </button>
        <button 
          className={`session-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          🎙️ Log Feed ({session.notes?.length || 0})
        </button>
      </div>

      {activeTab === 'todos' ? (
        session.todos && session.todos.length > 0 ? (
          <div className="todos-section" style={{ flexGrow: 1, overflowY: "auto" }}>
            <div className="todo-list">
              {session.todos.map((todo, idx) => (
                <TodoListItem 
                  key={todo.id} 
                  todo={todo} 
                  index={idx} 
                  elapsed={elapsed} 
                  onClick={() => toggleTodo(idx)} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="procrastination-nudge" style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            💡 Break it down: <code>/todo [first small step]</code>
          </div>
        )
      ) : (
        <div className="notes-feed-container" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flexGrow: 1, overflowY: "auto" }}>
            {session.notes.length > 0 ? (
              session.notes.map((note, idx) => (
                <NoteItem key={idx} note={note} />
              ))
            ) : (
              <div className="empty-state" style={{ margin: "auto" }}>
                No notes logged yet.
                <br />
                Type above to capture thoughts, reminders, or updates.
              </div>
            )}
            <div ref={notesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
