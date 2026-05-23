import React, { useEffect, useRef } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { SuggestionsOverlay } from "./SuggestionsOverlay";
import { formatPanicTime, formatTimestamp } from "../utils/timeFormatters";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { getCommandSplit } from "../utils/commandParser";

type PanicModalProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const PanicModal: React.FC<PanicModalProps> = ({ inputRef, handleKeyDown }) => {
  const mode = useLockinStore((state) => state.mode);
  const input = useLockinStore((state) => state.input);
  const setInput = useLockinStore((state) => state.setInput);
  const queue = useLockinStore((state) => state.queue);
  const session = useLockinStore((state) => state.session);
  const elapsed = useLockinStore((state) => state.elapsed);
  const dismissedSuggestions = useLockinStore((state) => state.dismissedSuggestions);
  const selectedSuggestionIndex = useLockinStore((state) => state.selectedSuggestionIndex);
  const showPanicModal = useLockinStore((state) => state.showPanicModal);

  // Actions
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const setShowPanicModal = useLockinStore((state) => state.setShowPanicModal);

  const sessions = useLockinStore((state) => state.sessions);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);

  // Auto-scroll notes ref
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.notes) {
      notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.notes]);

  if (!showPanicModal || mode !== "active" || !session || session.panicEndElapsed === undefined) {
    return null;
  }

  const remaining = session.panicEndElapsed - elapsed;
  const isCritical = remaining <= 15;
  const isOvertime = remaining < 0;

  // Clock computations
  const totalSeconds = elapsed;
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const cx = 40;
  const cy = 40;
  const r = 32;

  const toPoint = (deg: number, len: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(rad) * len, y: cy + Math.sin(rad) * len };
  };

  const hourPt = toPoint(hourDeg, 16);
  const minPt = toPoint(minuteDeg, 22);
  const secPt = toPoint(secondDeg, 28);

  // Suggestion filters
  const commandSuggestions = getCommandSuggestions(mode, sessions, queue, idleSidetracks, session, null, input);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);
  const showSuggestions = filteredSuggestions.length > 0 && input.startsWith("/") && !dismissedSuggestions;

  const placeholderText = "drop a note, add step /t, complete /d, or extend /panic +5m...";
  const hintText = "type note + ↵ to log  ·  /panic [time] to extend  ·  /min to close overlay";

  return (
    <div className={`panic-modal-overlay ${isCritical ? "critical" : ""} ${isOvertime ? "overtime" : ""}`}>
      <div className="panic-modal-container">
        
        {/* Modal Header */}
        <div className="panic-modal-header">
          <div className="panic-modal-badge">
            <span className={`pulse-dot ${isCritical ? "panic-critical" : ""}`}></span>
            <span>PANIC MODE ACTIVE</span>
          </div>
          <button className="panic-modal-minimize-btn" onClick={() => setShowPanicModal(false)} title="Minimize focus (Esc)">
            Minimize [ESC]
          </button>
        </div>

        {/* Large Centered Visual Timer */}
        <div className="panic-modal-visual-section">
          <div className="panic-modal-clock-wrapper">
            <svg className="panic-modal-clock" width={80} height={80} viewBox="0 0 80 80">
              <circle className="clock-face" cx={cx} cy={cy} r={r} />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const outer = toPoint(deg, r);
                const inner = toPoint(deg, r - 5);
                return (
                  <line
                    key={deg}
                    className="clock-marker"
                    x1={inner.x} y1={inner.y}
                    x2={outer.x} y2={outer.y}
                  />
                );
              })}
              <line className="clock-hand hour-hand" x1={cx} y1={cy} x2={hourPt.x} y2={hourPt.y} />
              <line className="clock-hand minute-hand" x1={cx} y1={cy} x2={minPt.x} y2={minPt.y} />
              <line className="clock-hand second-hand" x1={cx} y1={cy} x2={secPt.x} y2={secPt.y} />
              <circle className="clock-center" cx={cx} cy={cy} r={3.5} />
            </svg>
          </div>
          
          <div className={`panic-modal-digital ${isCritical ? "critical-text" : ""}`}>
            {isOvertime ? `⚠️ ${formatPanicTime(remaining)}` : `⏳ ${formatPanicTime(remaining)}`}
          </div>

          <div className="panic-modal-task-name">{session.task}</div>
        </div>

        {/* Panel Content (Split View: Left Checklist, Right Notes) */}
        <div className="panic-modal-panels">
          
          {/* Checklist Panel */}
          <div className="panic-modal-panel">
            <div className="section-label">Subtasks</div>
            {session.todos && session.todos.length > 0 ? (
              <div className="panic-modal-todos">
                {session.todos.map((todo, idx) => (
                  <div key={todo.id} className="todo-item" onClick={() => toggleTodo(idx)}>
                    <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
                    <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                      {idx + 1}. {todo.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panic-modal-empty">
                💡 Break it down! Type <code>/todo [subtask]</code> to create a checklist.
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div className="panic-modal-panel">
            <div className="section-label">Log Feed</div>
            <div className="panic-modal-notes">
              {session.notes.length > 0 ? (
                session.notes.map((note, idx) => (
                  <div key={idx} className="note-item">
                    <span className="note-time">{formatTimestamp(note.ts)}</span>
                    <span className="note-text">{note.text}</span>
                  </div>
                ))
              ) : (
                <div className="panic-modal-empty">No notes logged in this session yet.</div>
              )}
              <div ref={notesEndRef} />
            </div>
          </div>

        </div>

        {/* Command Input Area */}
        <div className="panic-modal-input-area">
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
          <div className="input-wrapper" onClick={() => inputRef.current?.focus()}>
            {(() => {
              const split = getCommandSplit(input);
              if (split) {
                const category = (() => {
                  const tasks = ["add", "sidetrack", "todo", "continue", "remove-queue", "delete-idea", "panic"];
                  const actions = ["done", "check", "remove", "export", "minimize"];
                  const nav = ["history", "inbox", "profile", "help"];
                  const settings = ["theme", "zen", "sound"];
                  
                  if (tasks.includes(split.cmdName)) return "tasks";
                  if (actions.includes(split.cmdName)) return "actions";
                  if (nav.includes(split.cmdName)) return "nav";
                  if (settings.includes(split.cmdName)) return "settings";
                  return "default";
                })();

                return (
                  <>
                    <div className={`command-chip chip-${category}`}>
                      {split.commandPart.substring(1)}
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      className="command-input"
                      value={split.argsPart}
                      onChange={(e) => setInput(split.commandPart + " " + e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholderText}
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
        </div>

      </div>
    </div>
  );
};
