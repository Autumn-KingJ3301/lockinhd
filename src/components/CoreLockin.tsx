import React, { useEffect, useRef } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { SuggestionsOverlay } from "./SuggestionsOverlay";
import { formatTime, formatTimestamp } from "../utils/timeFormatters";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";

type CoreLockinProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholderText: string;
  hintText: string;
};

export const CoreLockin: React.FC<CoreLockinProps> = ({
  inputRef,
  handleKeyDown,
  placeholderText,
  hintText,
}) => {
  // Bind directly to Zustand Store
  const mode = useLockinStore((state) => state.mode);
  const input = useLockinStore((state) => state.input);
  const setInput = useLockinStore((state) => state.setInput);
  const queue = useLockinStore((state) => state.queue);
  const session = useLockinStore((state) => state.session);
  const wrapData = useLockinStore((state) => state.wrapData);
  const elapsed = useLockinStore((state) => state.elapsed);
  const completedCount = useLockinStore((state) => state.sessions.length);
  const toastMsg = useLockinStore((state) => state.toastMsg);
  const dismissedSuggestions = useLockinStore((state) => state.dismissedSuggestions);
  const selectedSuggestionIndex = useLockinStore((state) => state.selectedSuggestionIndex);
  const zenMode = useLockinStore((state) => state.zenMode);
  const triageSidetracks = useLockinStore((state) => state.triageSidetracks);
  const activeTriageIndex = useLockinStore((state) => state.activeTriageIndex);
  const soundEnabled = useLockinStore((state) => state.soundEnabled);
  const showHelp = useLockinStore((state) => state.showHelp);

  // Actions
  const startSession = useLockinStore((state) => state.startSession);
  const deleteQueueItem = useLockinStore((state) => state.deleteQueueItem);
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const setShowHelp = useLockinStore((state) => state.setShowHelp);

  // Local Ref for auto-scrolling
  const notesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll notes feed in Active mode
  useEffect(() => {
    if (mode === "active" && session?.notes) {
      notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.notes, mode]);

  // Suggestions — sourced from shared utility (single source of truth)
  const commandSuggestions = getCommandSuggestions(mode);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);
  const showSuggestions = filteredSuggestions.length > 0 && !dismissedSuggestions;

  const handleQueueItemClick = (item: { id: number; text: string }) => {
    deleteQueueItem(item.id);
    startSession(item.text);
  };

  const handleDeleteQueueItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteQueueItem(id);
  };

  return (
    <div className={`app-container${zenMode ? " zen-active" : ""}`}>
      {toastMsg && <div className="toast-notification">{toastMsg}</div>}

      {/* Header - Always visible */}
      <header className="app-header">
        <div className="app-title">LOCK·IN</div>
        <div className="header-status">
          {completedCount >= 1 && (
            <span className="session-count">
              {completedCount} {completedCount === 1 ? "session" : "sessions"}
            </span>
          )}

          {mode === "idle" && <div className="status-badge">idle</div>}

          {mode === "active" && (
            <div className="status-badge active">
              <span className="pulse-dot"></span>
              <span>{formatTime(elapsed)}</span>
            </div>
          )}

          {mode === "wrap" && wrapData && (
            <div className="status-badge wrap">
              <span>{formatTime(wrapData.duration || 0)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content Area - changes per mode */}
      <main className="app-content" style={{ position: "relative" }}>
        {/* Help Overlay */}
        {showHelp && (
          <div className="help-overlay" key="help">
            <div className="help-header">
              <span className="help-title">COMMAND REFERENCE</span>
              <button className="delete-btn" style={{ opacity: 0.7, fontSize: 16 }} onClick={() => setShowHelp(false)} title="Close help (Esc)">×</button>
            </div>
            <div className="help-body">
              <div className="help-section">
                <div className="help-section-label">Sessions</div>
                <div className="help-row"><kbd>/done</kbd><kbd>/d</kbd><span>End current session</span></div>
                <div className="help-row"><kbd>/continue</kbd><kbd>/con</kbd><span>Resume last session</span></div>
                <div className="help-row"><kbd>/continue 2</kbd><span>Resume Nth-from-last session</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Task Queue</div>
                <div className="help-row"><kbd>/add [task]</kbd><span>Add task to queue</span></div>
                <div className="help-row"><kbd>/rq [n]</kbd><span>Remove queue item at index n</span></div>
                <div className="help-row"><span className="help-tip">Tab</span><span>Autofill first queued task</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Todos</div>
                <div className="help-row"><kbd>/todo [step]</kbd><kbd>/t</kbd><span>Add a subtask</span></div>
                <div className="help-row"><kbd>/check [n]</kbd><kbd>/c</kbd><span>Toggle todo n (or next unchecked)</span></div>
                <div className="help-row"><kbd>/remove [n]</kbd><kbd>/r</kbd><span>Remove todo at index n</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Braindump &amp; Sidetracks</div>
                <div className="help-row"><kbd>/sidetrack [idea]</kbd><kbd>/s</kbd><span>Capture a jumping thought</span></div>
                <div className="help-row"><kbd>/di [n]</kbd><span>Delete inbox idea at index n</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">ADHD Focus Mode</div>
                <div className="help-row"><kbd>/zen</kbd><kbd>/z</kbd><span>Toggle Zen mode (hide panels)</span></div>
                <div className="help-row"><kbd>/sound</kbd><kbd>/so</kbd><span>Toggle audio feedback</span></div>
                <div className="help-row"><span className="help-tip">Q S D ↵</span><span>Triage sidetracks in wrap mode</span></div>
                <div className="help-row"><span className="help-tip">type + ↵</span><span>Save a resume cue in wrap mode</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Panels &amp; Export</div>
                <div className="help-row"><kbd>/history</kbd><kbd>/h</kbd><span>Toggle history panel</span></div>
                <div className="help-row"><kbd>/inbox</kbd><kbd>/i</kbd><span>Toggle inbox panel</span></div>
                <div className="help-row"><kbd>/theme [light|dark|system]</kbd><span>Change theme</span></div>
                <div className="help-row"><kbd>/export</kbd><kbd>/e</kbd><span>Copy session log to clipboard</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Keyboard Shortcuts</div>
                <div className="help-row"><span className="help-tip">Alt+H</span><span>Toggle history panel</span></div>
                <div className="help-row"><span className="help-tip">Alt+I</span><span>Toggle inbox panel</span></div>
                <div className="help-row"><span className="help-tip">Esc</span><span>Close this help panel</span></div>
              </div>
            </div>
          </div>
        )}

        {mode === "idle" && (
          <div className="mode-container" key="idle">
            {queue.length > 0 ? (
              <>
                <div className="section-label">UP NEXT</div>
                <div className="queue-list">
                  {queue.map((item, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <div
                        key={item.id}
                        className={`queue-item ${isFirst ? "first-item" : ""}`}
                        onClick={() => handleQueueItemClick(item)}
                      >
                        <div className="queue-item-left">
                          <span className="queue-index">{idx + 1}</span>
                          <span className="queue-text">{item.text}</span>
                        </div>
                        <div className="queue-item-actions">
                          {isFirst && <span className="badge badge-start">↵ start</span>}
                          <button
                            className="delete-btn"
                            onClick={(e) => handleDeleteQueueItem(e, item.id)}
                            title="Remove task"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                No active session.
                <br />
                Type above to lock in on a task, or `/add [task]` to queue it.
              </div>
            )}
          </div>
        )}

        {mode === "active" && session && (
          <div className="mode-container" key="active">
            <div className="task-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>WORKING ON</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-revision">rev {session.revision || 1}</span>
                <span className="badge" style={{ color: soundEnabled ? "var(--color-accent)" : "var(--color-muted)", border: "0.5px solid var(--color-border)", background: "var(--color-surface)", fontSize: "9px", cursor: "pointer" }} title={soundEnabled ? "Sound on (/sound to toggle)" : "Sound off (/sound to toggle)"} onClick={() => setToastMsg(soundEnabled ? "Sound on. Use /sound to toggle." : "Sound off. Use /sound to toggle.")}>{soundEnabled ? "♪" : "♪̶"}</span>
              </div>
            </div>
            <div className="task-name-large">{session.task}</div>

            {/* Resume Cue Banner */}
            {session.resumeCue && (
              <div className="resume-cue-banner">
                <span className="resume-cue-icon">💡</span>
                <span className="resume-cue-text">Resume here: {session.resumeCue}</span>
              </div>
            )}

            {session.todos && session.todos.length > 0 ? (
              <div className="todos-section">
                <div className="task-label">TODOS</div>
                <div className="todo-list">
                  {session.todos.map((todo, idx) => (
                    <div
                      key={todo.id}
                      className="todo-item"
                      onClick={() => toggleTodo(idx)}
                    >
                      <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                      <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                        {idx + 1}. {todo.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="procrastination-nudge">
                💡 Break it down: <code>/todo [first small step]</code>
              </div>
            )}

            <hr className="content-divider" />
            <div className="notes-feed-container">
              {session.notes.length > 0 ? (
                session.notes.map((note, idx) => (
                  <div key={idx} className="note-item">
                    <span className="note-time">{formatTimestamp(note.ts)}</span>
                    <span className="note-text">{note.text}</span>
                  </div>
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

        {mode === "wrap" && wrapData && (
          <div className="mode-container" key="wrap">
            <div className="wrap-header-row">
              <div className="wrap-success-indicator" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="check-icon">✓</span>
                <span>Session Done</span>
                <span className="badge badge-revision">rev {wrapData.revision || 1}</span>
              </div>
              <div className="wrap-duration">{formatTime(wrapData.duration || 0)}</div>
            </div>
            <div className="wrap-task-name">{wrapData.task}</div>

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
                        <div key={todo.id} className="todo-item" style={{ cursor: "default" }}>
                          <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                          <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                            {idx + 1}. {todo.text}
                          </span>
                        </div>
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
                        <div key={idx} className="note-item">
                          <span className="note-time">{formatTimestamp(note.ts)}</span>
                          <span className="note-text">{note.text}</span>
                        </div>
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
        )}
      </main>

      {/* Input Area - always visible, always focused */}
      <footer className="app-footer">
        {showSuggestions && (
          <SuggestionsOverlay
            suggestions={filteredSuggestions}
            selectedIndex={selectedSuggestionIndex}
            onSelect={(cmd) => {
              setInput(cmd);
              inputRef.current?.focus();
            }}
          />
        )}
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            autoFocus
          />
        </div>
        <div className="hint-text">{hintText}</div>
      </footer>
    </div>
  );
};
