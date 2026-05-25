import React, { useEffect, useRef } from "react";
import { useLockinStore } from "../store/useLockinStore";

// Sub-views
import { ActiveSessionView } from "./views/ActiveSessionView";
import { WrapSessionView } from "./views/WrapSessionView";
import { HistoryDetailView } from "./views/HistoryDetailView";
import { TraceView } from "./views/TraceView";
import { SessionSetupView } from "./views/SessionSetupView";
import { IdleView } from "./views/IdleView";

// UI Components
import { HelpOverlay } from "./ui/HelpOverlay";

import { CommandBar } from "./CommandBar";
import { formatTime, formatPanicTime } from "../utils/timeFormatters";

type CoreLockinProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
};

export const CoreLockin: React.FC<CoreLockinProps> = ({
  inputRef,
}) => {
  const mode = useLockinStore((state) => state.mode);
  const session = useLockinStore((state) => state.session);
  const wrapData = useLockinStore((state) => state.wrapData);
  const elapsed = useLockinStore((state) => state.elapsed);
  const completedCount = useLockinStore((state) => state.sessions.length);
  const toastMsg = useLockinStore((state) => state.toastMsg);
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
        <CommandBar ref={inputRef as any} />
      </footer>
    </div>
  );
};
