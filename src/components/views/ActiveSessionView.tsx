import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../../store/useLockinStore";
import { formatPanicTime } from "../../utils/timeFormatters";
import { NoteItem } from "../ui/NoteItem";
import { TodoListItem } from "../ui/TodoListItem";

export const ActiveSessionView: React.FC<{ notesEndRef: React.RefObject<HTMLDivElement | null> }> = ({ notesEndRef }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"todos" | "notes" | "boards">("todos");
  const session = useLockinStore((state) => state.session);
  const boards = useLockinStore((state) => state.boards);
  const setActiveBoardId = useLockinStore((state) => state.setActiveBoardId);
  const createBoard = useLockinStore((state) => state.createBoard);
  const associateBoardToSession = useLockinStore((state) => state.associateBoardToSession);
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

      {/* Associated Brainstorm Board */}
      {/* {brainstormBoard && (
        <div 
          className="resume-cue-banner" 
          style={{ cursor: "pointer", border: "1px solid var(--color-accent)", backgroundColor: "var(--color-accent-bg)" }}
          onClick={() => {
            setActiveBoardId(brainstormBoard.id);
            navigate("/brainstorm");
          }}
        >
          <span className="resume-cue-icon">🎨</span>
          <span className="resume-cue-text">Brainstorm Board: <strong>{brainstormBoard.title}</strong></span>
        </div>
      )} */}

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
        <button 
          className={`session-tab-btn ${activeTab === 'boards' ? 'active' : ''}`}
          onClick={() => setActiveTab('boards')}
        >
          🎨 Boards ({boards.length})
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
      ) : activeTab === 'notes' ? (
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
      ) : (
        <div className="boards-tab-container" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <div className="todo-list" style={{ flexGrow: 1, overflowY: "auto" }}>
            {boards.length > 0 ? (
              boards.map((board) => (
                <div 
                  key={board.id} 
                  className={`todo-item ${session.brainstormBoardId === board.id ? "active" : ""}`}
                  style={{ 
                    cursor: "pointer", 
                    justifyContent: "space-between",
                    borderLeft: session.brainstormBoardId === board.id ? "2px solid var(--color-accent)" : "none",
                    paddingLeft: session.brainstormBoardId === board.id ? "10px" : "12px"
                  }}
                  onClick={() => {
                    associateBoardToSession(board.id);
                    setActiveBoardId(board.id);
                    navigate("/brainstorm");
                  }}
                >
                   <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="todo-checkbox" style={{ color: "var(--color-muted)" }}>
                      {session.brainstormBoardId === board.id ? "📍" : "📄"}
                    </span>
                    <span className="todo-text">{board.title}</span>
                  </div>
                  {session.brainstormBoardId === board.id && (
                    <span className="badge" style={{ fontSize: "9px", background: "var(--color-accent-bg)", color: "var(--color-accent)" }}>Active</span>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ margin: "auto" }}>
                No boards created yet.
              </div>
            )}
          </div>
          <button 
            className="theme-toggle-btn" 
            style={{ marginTop: "12px", width: "100%", padding: "10px" }}
            onClick={() => {
              const newName = prompt("Board name:", "Session Brainstorm") || "Untitled Board";
              const newId = createBoard(newName);
              associateBoardToSession(newId);
              setActiveBoardId(newId);
              navigate("/brainstorm");
            }}
          >
            + Create New Board
          </button>
        </div>
      )}
    </div>
  );
};
