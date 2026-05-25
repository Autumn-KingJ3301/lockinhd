import React, { useEffect, useRef } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { SuggestionsOverlay } from "./SuggestionsOverlay";
import { formatTime, formatPanicTime } from "../utils/timeFormatters";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { getParsedCommand } from "../utils/commandParser";

// Sub-views
import { ActiveSessionView } from "./views/ActiveSessionView";
import { WrapSessionView } from "./views/WrapSessionView";
import { HistoryDetailView } from "./views/HistoryDetailView";
import { TraceView } from "./views/TraceView";
import { SessionSetupView } from "./views/SessionSetupView";
import { IdleView } from "./views/IdleView";

// UI Components
import { HelpOverlay } from "./ui/HelpOverlay";

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
  const showHelp = useLockinStore((state) => state.showHelp);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const setupStep = useLockinStore((state) => state.setupStep);
  const showTraceInline = useLockinStore((state) => state.showTraceInline);

  const activeArchiveId = useLockinStore((state) => state.activeArchiveId);
  const activeArchiveLabel = useLockinStore((state) => state.activeArchiveLabel);

  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const closeArchive = useLockinStore((state) => state.closeArchive);

  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "active" && session?.notes) {
      notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.notes, mode]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg, setToastMsg]);

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
        {selectedHistorySession && <HistoryDetailView />}
        {showTraceInline && !selectedHistorySession && <TraceView />}
        {showHelp && <HelpOverlay />}
        {setupStep !== "idle" && <SessionSetupView />}

        {mode === "idle" && setupStep === "idle" && !selectedHistorySession && !showTraceInline && !showHelp && (
          <IdleView />
        )}

        {mode === "active" && session && !selectedHistorySession && !showTraceInline && !showHelp && (
          <ActiveSessionView notesEndRef={notesEndRef} />
        )}

        {mode === "wrap" && wrapData && !selectedHistorySession && !showTraceInline && !showHelp && (
          <WrapSessionView />
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
