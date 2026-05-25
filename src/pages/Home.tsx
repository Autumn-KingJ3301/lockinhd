import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { Toolbar } from "../components/Toolbar";
import { HistoryPanel } from "../components/HistoryPanel";
import { InboxPanel } from "../components/InboxPanel";
import { TasksPanel } from "../components/TasksPanel";
import { CallbacksPanel } from "../components/CallbacksPanel";
import { SchedulesPanel } from "../components/SchedulesPanel";
import { RecurrenceModal } from "../components/RecurrenceModal";
import { CoreLockin } from "../components/CoreLockin";
import { FloatingTimer } from "../components/FloatingTimer";
import { PanicModal } from "../components/PanicModal";
import { AuroraCanvas } from "../components/AuroraCanvas";
import { ThemeEffectsOverlay } from "../components/ThemeEffectsOverlay";
import { presets } from "../themes/presets";
import { ArchivePanel, ArchiveConfirmBar, StashNotifBar } from "../components/ArchivePanel";

export const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  const mode = useLockinStore((state) => state.mode);
  const input = useLockinStore((state) => state.input);
  const session = useLockinStore((state) => state.session);
  const showHistoryPanel = useLockinStore((state) => state.showHistoryPanel);
  const showInboxPanel = useLockinStore((state) => state.showInboxPanel);
  const showTasksPanel = useLockinStore((state) => state.showTasksPanel);
  const theme = useLockinStore((state) => state.theme);
  const zenMode = useLockinStore((state) => state.zenMode);
  const showPanicModal = useLockinStore((state) => state.showPanicModal);
  const wrapData = useLockinStore((state) => state.wrapData);

  // Select store actions
  const setIsSystemDark = useLockinStore((state) => state.setIsSystemDark);
  const setShowHistoryPanel = useLockinStore((state) => state.setShowHistoryPanel);
  const setShowInboxPanel = useLockinStore((state) => state.setShowInboxPanel);
  const setShowTasksPanel = useLockinStore((state) => state.setShowTasksPanel);
  const setupStep = useLockinStore((state) => state.setupStep);
  const showCallbacksPanel = useLockinStore((state) => state.showCallbacksPanel);
  const showSchedulesPanel = useLockinStore((state) => state.showSchedulesPanel);
  const showArchivesPanel = useLockinStore((state) => state.showArchivesPanel);
  const showTraceInline = useLockinStore((state) => state.showTraceInline);

  const activeTheme = useThemeStore((state) => {
    const id = state.activeThemeId;
    if (id === "default") return null;
    return state.customThemes.find((t) => t.id === id) || presets.find((t) => t.id === id) || null;
  });
  const overlayType = activeTheme?.styles.effects.overlayType || "none";

  const energyRating =
    ((mode === "active" || mode === "panic") && session)
      ? (session.energyRating ?? 3)
      : ((mode === "wrap" && wrapData) ? (wrapData.energyRating ?? 3) : (
        setupStep !== "idle"
          ? (setupStep === "energy" && /^[1-5]$/.test(input.trim()) ? parseInt(input.trim(), 10) : 3)
          : null
      ));

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth Protection
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Synchronize theme configuration on mount/change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      localStorage.removeItem("lockin-theme");
    } else {
      root.classList.add(theme);
      localStorage.setItem("lockin-theme", theme);
    }
  }, [theme]);

  // Monitor system theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [setIsSystemDark]);

  // Global Refocus Handler
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== "INPUT" &&
        target.tagName !== "BUTTON" &&
        target.tagName !== "TEXTAREA" &&
        !target.closest(".panel-container") &&
        !target.closest(".theme-toggle-container")
      ) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  // Global Keyboard Shortcuts (Alt+H to toggle History, Alt+I to toggle Inbox)
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Global Enter focus
      if (e.key === "Enter") {
        const active = document.activeElement;
        const isInput = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA";
        const isButton = active?.tagName === "BUTTON";

        if (!isInput && !isButton) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }

      if (e.altKey && e.code === "KeyH") {
        e.preventDefault();
        setShowHistoryPanel(!showHistoryPanel);
      }
      if (e.altKey && e.code === "KeyI") {
        e.preventDefault();
        setShowInboxPanel(!showInboxPanel);
      }
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        setShowTasksPanel(!showTasksPanel);
      }
      if (e.key === "Escape" && showTraceInline) {
        useLockinStore.getState().toggleTrace(false);
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [showHistoryPanel, showInboxPanel, showTasksPanel, showTraceInline, setShowHistoryPanel, setShowInboxPanel, setShowTasksPanel]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="status-badge active">
          <span className="pulse-dot"></span>
          <span>LOADING SESSION...</span>
        </div>
      </div>
    );
  }


  return (
    <>
      <AuroraCanvas
        energyRating={energyRating}
        blurAmount={20}
        baseOpacity={0.32}
        yOffset={-150}
        heightMultiplier={3.0}
        waveSpeedMultiplier={1.9}
        raySpeedMultiplier={1}
      />
      <ThemeEffectsOverlay
        type={showPanicModal ? "none" : overlayType}
        isCritical={false}
        isOvertime={false}
        isGlobal={true}
      />
      {/* Utility Toolbar */}
      <Toolbar />

      {/* Archive confirm floating bar */}
      <ArchiveConfirmBar />

      {/* Stash notification bar */}
      <StashNotifBar />

      <div className={`workspace-wrapper${zenMode ? " zen-layout" : ""}`}>
        {/* Left Column: History Panel */}
        {showHistoryPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <HistoryPanel />
          </div>
        )}

        {/* New Left Column: Tasks Panel */}
        {showTasksPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <TasksPanel />
          </div>
        )}


              <CoreLockin
                inputRef={inputRef}
              />


        {/* Right Column: Floating Inbox */}
        {showInboxPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <InboxPanel />
          </div>
        )}

        {/* Callbacks Panel */}
        {showCallbacksPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <CallbacksPanel />
          </div>
        )}

        {/* Schedules Panel */}
        {showSchedulesPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <SchedulesPanel />
          </div>
        )}

        {/* Archives Panel */}
        {showArchivesPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <ArchivePanel />
          </div>
        )}
      </div>

      {/* Panic Modal Overlay */}
      <PanicModal inputRef={inputRef} />

      {/* Recurrence Modal Overlay */}
      <RecurrenceModal />

      {/* Floating Timer (visible during active session) */}
      <FloatingTimer />
    </>
  );
};
