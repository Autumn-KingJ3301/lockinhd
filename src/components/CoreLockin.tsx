import React, { useEffect, useRef } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { SuggestionsOverlay } from "./SuggestionsOverlay";
import { formatTime, formatTimestamp, formatSummaryDuration, formatPanicTime } from "../utils/timeFormatters";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { getParsedCommand } from "../utils/commandParser";

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
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const selectedRevisionIndex = useLockinStore((state) => state.selectedRevisionIndex);
  const setupStep = useLockinStore((state) => state.setupStep);
  const setupTaskName = useLockinStore((state) => state.setupTaskName);
  const setupEstimatedDuration = useLockinStore((state) => state.setupEstimatedDuration);
  const showTraceInline = useLockinStore((state) => state.showTraceInline);

  const activeArchiveId = useLockinStore((state) => state.activeArchiveId);
  const activeArchiveLabel = useLockinStore((state) => state.activeArchiveLabel);

  // Actions
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  const closeArchive = useLockinStore((state) => state.closeArchive);
  const toggleTrace = useLockinStore((state) => state.toggleTrace);
  const initiateSessionSetup = useLockinStore((state) => state.initiateSessionSetup);

  // Local Ref for auto-scrolling
  const notesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll notes feed in Active mode
  useEffect(() => {
    if (mode === "active" && session?.notes) {
      notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.notes, mode]);

  // Auto-dismiss toast notifications after 3 seconds
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg, setToastMsg]);

  // Suggestions — sourced from shared utility (single source of truth)
  const sessions = useLockinStore((state) => state.sessions);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const commandSuggestions = getCommandSuggestions(mode, sessions, queue, idleSidetracks, session, selectedHistorySession, input);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);
  const showSuggestions = filteredSuggestions.length > 0 && !dismissedSuggestions && setupStep === "idle";



  if (mode === "panic") return null;

  return (
    <div className={`app-container${zenMode ? " zen-active" : ""}${activeArchiveId ? " archive-active" : ""}`}>
      {activeArchiveId && (
        <div className="archive-active-banner">
          <span className="archive-banner-text">
            📁 Viewing Archive: {activeArchiveLabel || activeArchiveId}
          </span>
          <button 
            className="archive-banner-close-btn" 
            onClick={closeArchive}
            title="Close archive and restore workspace"
          >
            Close Archive ✕
          </button>
        </div>
      )}
      {toastMsg && (
        <div className="toast-notification" onClick={() => setToastMsg(null)} title="Click to dismiss">
          {toastMsg}
        </div>
      )}

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
            <div className={`status-badge active ${session?.timerEndElapsed !== undefined ? "panic-active-badge" : ""}`}>
              {session?.timerEndElapsed !== undefined ? (
                <>
                  <span className={`pulse-dot ${session.timerEndElapsed - elapsed <= 15 ? "panic-critical-pulse" : ""}`}></span>
                  <span style={{ color: "var(--color-panic)", fontWeight: "bold" }}>
                    ⏳ {formatPanicTime(session.timerEndElapsed - elapsed)}
                  </span>
                </>
              ) : (
                <>
                  <span className="pulse-dot"></span>
                  <span>{formatTime(elapsed)}</span>
                </>
              )}
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
        {/* History View */}
        {selectedHistorySession && (() => {
          const isViewingRevision = selectedRevisionIndex !== null && selectedHistorySession.revisionHistory && selectedHistorySession.revisionHistory[selectedRevisionIndex];
          const displayData = isViewingRevision ? selectedHistorySession.revisionHistory![selectedRevisionIndex!] : selectedHistorySession;
          
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
                      useLockinStore.setState({ selectedRevisionIndex: null });
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

              <div className="task-name-large">{selectedHistorySession.task}</div>

              <div className="wrap-duration" style={{ fontSize: "12px", marginBottom: "16px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
                {isViewingRevision ? "Revision Time: " : "Total Focus Time: "}
                {formatSummaryDuration(displayData.duration || 0)}
              </div>

              {displayData.todos && displayData.todos.length > 0 && (
                <div className="todos-section" style={{ marginBottom: "16px" }}>
                  <div className="task-label">Todos {isViewingRevision ? "(Snapshot)" : ""}</div>
                  <div className="todo-list">
                    {displayData.todos.map((todo) => (
                      <div key={todo.id} className="todo-item" style={{ cursor: "default" }}>
                        <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                        <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                          {todo.text}
                        </span>
                      </div>
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
                    <div key={idx} className="note-item">
                      <span className="note-time">{formatTimestamp(note.ts)}</span>
                      <span className="note-text">{note.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No notes recorded.</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Trace View (Inline) */}
        {showTraceInline && !selectedHistorySession && (() => {
          const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
          const lastRevision = lastSession?.revisionHistory?.[lastSession.revisionHistory.length - 1];
          const lastCompletedTodo = lastSession?.todos?.filter(t => t.completed).slice(-1)[0];
          const lastNote = lastRevision?.notes.slice(-1)[0] || lastSession?.notes.slice(-1)[0];

          return (
            <div className="mode-container" key="trace-inline" style={{ animation: "none" }}>
              <div className="history-detail-header" style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    className="theme-toggle-btn"
                    onClick={() => toggleTrace(false)}
                    style={{ fontSize: "11px", padding: "2px 6px" }}
                  >
                    ← Dismiss Trace
                  </button>
                  <span className="section-label" style={{ margin: 0 }}>Memory Trace</span>
                </div>
                <div className="badge badge-revision" style={{ fontSize: "11px", background: "var(--color-accent)", color: "var(--color-bg)" }}>/trace</div>
              </div>

              <div className="task-name-large">{lastSession ? lastSession.task : "No History Found"}</div>

              {lastSession && (
                <>
                  <div className="wrap-duration" style={{ fontSize: "12px", marginBottom: "20px", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
                    Spent {formatSummaryDuration(lastSession.duration || 0)} across {lastSession.revision || 1} revisions
                  </div>

                  {lastSession.resumeCue && (
                    <div className="resume-cue-banner" style={{ marginBottom: "20px" }}>
                      <span className="resume-cue-icon">💡</span>
                      <span className="resume-cue-text">Resume Breadcrumb: {lastSession.resumeCue}</span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "24px" }}>
                    {lastCompletedTodo && (
                      <div className="todo-item" style={{ cursor: "default", opacity: 0.7, border: "0.5px dashed var(--color-border)" }}>
                        <span className="todo-checkbox">[x]</span>
                        <span className="todo-text completed">Last Completed: {lastCompletedTodo.text}</span>
                      </div>
                    )}

                    {lastNote && (
                      <div className="note-item" style={{ border: "0.5px solid var(--color-border)", padding: "8px", borderRadius: "4px" }}>
                        <span className="note-time" style={{ fontSize: "9px" }}>LAST NOTE</span>
                        <span className="note-text">{lastNote.text}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      initiateSessionSetup(lastSession.task, { continueSession: lastSession });
                      toggleTrace(false);
                    }}
                    className="theme-toggle-btn"
                    style={{ 
                      width: "100%", 
                      padding: "12px", 
                      fontSize: "13px", 
                      fontWeight: "bold",
                      backgroundColor: "var(--color-text)",
                      color: "var(--color-bg)"
                    }}
                  >
                    Continue this Session
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* Help Overlay */}
        {showHelp && (
          <div className="help-overlay" key="help">
            <div className="help-header">
              <span className="help-title">COMMAND REFERENCE</span>
            </div>
            <div className="help-body">
              <div className="help-section">
                <div className="help-section-label">Sessions</div>
                <div className="help-row"><kbd>/done</kbd><kbd>/d</kbd><span>End current session</span></div>
                <div className="help-row"><kbd>/timer [time]</kbd><span>Set inline session timer</span></div>
                <div className="help-row"><kbd>/continue</kbd><kbd>/con</kbd><span>Resume last session</span></div>
                <div className="help-row"><kbd>/rev [n]</kbd><span>View data for revision n (history only)</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Task Queue & Panic</div>
                <div className="help-row"><kbd>/add [task]</kbd><span>Add task to queue</span></div>
                <div className="help-row"><kbd>/panic [time] [task]</kbd><span>Start chore in panic mode</span></div>
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
                <div className="help-row"><kbd>/tasks</kbd><span>Toggle global tasks panel</span></div>
                <div className="help-row"><kbd>/history</kbd><kbd>/h</kbd><span>Toggle history panel</span></div>
                <div className="help-row"><kbd>/inbox</kbd><kbd>/i</kbd><span>Toggle inbox panel</span></div>
                <div className="help-row"><kbd>/theme [light|dark|system]</kbd><span>Change theme</span></div>
                <div className="help-row"><kbd>/export</kbd><kbd>/e</kbd><span>Copy session log to clipboard</span></div>
              </div>
              <div className="help-section">
                <div className="help-section-label">Keyboard Shortcuts</div>
                <div className="help-row"><span className="help-tip">Alt+T</span><span>Toggle tasks panel</span></div>
                <div className="help-row"><span className="help-tip">Alt+H</span><span>Toggle history panel</span></div>
                <div className="help-row"><span className="help-tip">Alt+I</span><span>Toggle inbox panel</span></div>
                <div className="help-row"><span className="help-tip">Esc</span><span>Close this help panel</span></div>
              </div>
            </div>
          </div>
        )}

        {setupStep !== "idle" && (
          <div className="mode-container" key="setup">
            <div className="setup-card">
              <div className="setup-header">CALIBRATING SESSION</div>
              <div className="setup-task-name">{setupTaskName}</div>
              
              <div className="setup-steps-progress">
                <div className={`setup-progress-dot ${setupStep === "estimate" ? "active" : "completed"}`}>
                  <span className="step-num">1</span>
                  <span className="step-label">Time Estimate</span>
                </div>
                <div className="setup-progress-line"></div>
                <div className={`setup-progress-dot ${setupStep === "energy" ? "active" : ""}`}>
                  <span className="step-num">2</span>
                  <span className="step-label">Energy Level</span>
                </div>
              </div>

              <div className="setup-body">
                {setupStep === "estimate" && (
                  <div className="setup-prompt-body">
                    <p className="setup-nudge">ADHD brains struggle with time blindness. Let's calibrate: how long will this take?</p>
                    <div className="setup-input-hint">Type e.g., <strong>25m</strong>, <strong>10m</strong>, <strong>1h</strong> or press <strong>Enter</strong> to skip.</div>
                  </div>
                )}
                {setupStep === "energy" && (
                  <div className="setup-prompt-body">
                    <p className="setup-nudge">Check your energy level: 1 (low) to 5 (high).</p>
                    <div className="setup-input-hint">Enter a rating from <strong>1</strong> to <strong>5</strong>, or press <strong>Enter</strong> to skip.</div>
                    {setupEstimatedDuration !== null && (
                      <div className="setup-stat-summary">
                        ⏱️ Estimated time: <strong>{formatSummaryDuration(setupEstimatedDuration)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === "idle" && setupStep === "idle" && !selectedHistorySession && (
          <div className="mode-container" key="idle">
            <div className="empty-state">
              No active session.
              <br />
              Type above to lock in on a task, or `/add [task]` to queue it.
            </div>
          </div>
        )}

        {mode === "active" && session && !selectedHistorySession && (
          <div className="mode-container" key="active">
            <div className="task-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>WORKING ON</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-revision">rev {session.revision || 1}</span>
                <span className="badge" style={{ color: soundEnabled ? "var(--color-accent)" : "var(--color-muted)", border: "0.5px solid var(--color-border)", background: "var(--color-surface)", fontSize: "9px", cursor: "pointer" }} title={soundEnabled ? "Sound on (/sound to toggle)" : "Sound off (/sound to toggle)"} onClick={() => setToastMsg(soundEnabled ? "Sound on. Use /sound to toggle." : "Sound off. Use /sound to toggle.")}>{soundEnabled ? "♪" : "♪̶"}</span>
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

            {session.todos && session.todos.length > 0 ? (
              <div className="todos-section">
                <div className="task-label">TODOS</div>
                <div className="todo-list">
                  {session.todos.map((todo, idx) => {
                    let currentTodoElapsed = todo.isTimerRunning 
                      ? (todo.timerDuration || 0) + (elapsed - (todo.timerStartElapsed || elapsed))
                      : (todo.timerDuration || 0);

                    const isCountdown = todo.timerTargetElapsed !== undefined;
                    let displayTime = currentTodoElapsed;
                    let isExpired = false;

                    if (isCountdown) {
                      const remaining = todo.timerTargetElapsed! - elapsed;
                      displayTime = Math.max(0, remaining);
                      isExpired = remaining <= 0;
                    }

                    return (
                      <div
                        key={todo.id}
                        className={`todo-item ${todo.isTimerRunning ? "timer-running" : ""} ${isExpired ? "subtimer-expired" : ""}`}
                        onClick={() => toggleTodo(idx)}
                      >
                        <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                        <span className={`todo-text ${todo.completed ? "completed" : ""}`} style={{ flexGrow: 1 }}>
                          {idx + 1}. {todo.text}
                        </span>
                        
                        {(currentTodoElapsed > 0 || todo.isTimerRunning || isCountdown) && (
                          <span style={{ 
                            fontSize: "10px", 
                            color: todo.isTimerRunning ? "var(--color-accent)" : "var(--color-muted)", 
                            marginRight: "4px", 
                            fontFamily: "var(--font-mono)",
                            fontWeight: isExpired ? "bold" : "normal"
                          }}>
                            {isCountdown ? (isExpired ? "00:00" : formatTime(displayTime)) : formatTime(displayTime)}
                          </span>
                        )}
                      </div>
                    );
                  })}
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

        {mode === "wrap" && wrapData && !selectedHistorySession && (
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
        <div className={`input-wrapper ${setupStep !== "idle" ? "setup-input-active" : ""}`} onClick={() => inputRef.current?.focus()}>
          {setupStep !== "idle" ? (
            <input
              ref={inputRef}
              type="text"
              className="command-input setup-mode-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              autoFocus
            />
          ) : (() => {
            const parsed = getParsedCommand(input);
            if (parsed) {
              return (
                <>
                  {parsed.tokens.map((token, idx) => (
                    <div 
                      key={idx} 
                      className={`command-chip chip-${token.category || (token.schema ? "default" : "tasks")}`}
                    >
                      {token.value}
                    </div>
                  ))}
                    <input
                      ref={inputRef}
                      type="text"
                      className="command-input"
                      value={parsed.remainingInput}
                      onChange={(e) => {
                        const base = parsed.tokens.map(t => (t.type === "command" ? "/" : "") + t.value).join("\x1f");
                        setInput(base + "\x1f" + e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={parsed.nextArg ? `[${parsed.nextArg.name}]` : placeholderText}
                      autoFocus
                    />
                </>
              );
            }
            return (
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
            );
          })()}
        </div>
        <div className="hint-text">{hintText}</div>
      </footer>
    </div>
  );
};
