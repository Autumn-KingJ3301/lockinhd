import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useCloudSync } from "../hooks/useCloudSync";
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
import { playThemeTickSound, playThemePanicExpiredAlarm, playThemeWarningSound } from "../utils/audioSynth";
import type { Theme } from "../types";

export const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  // Activate cloud sync
  useCloudSync();

  // Select state from centralized Zustand store
  const mode = useLockinStore((state) => state.mode);
  const input = useLockinStore((state) => state.input);
  const setInput = useLockinStore((state) => state.setInput);
  const queue = useLockinStore((state) => state.queue);
  const session = useLockinStore((state) => state.session);
  const sessions = useLockinStore((state) => state.sessions);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const showHistoryPanel = useLockinStore((state) => state.showHistoryPanel);
  const showInboxPanel = useLockinStore((state) => state.showInboxPanel);
  const showTasksPanel = useLockinStore((state) => state.showTasksPanel);
  const theme = useLockinStore((state) => state.theme);
  const dismissedSuggestions = useLockinStore((state) => state.dismissedSuggestions);
  const selectedSuggestionIndex = useLockinStore((state) => state.selectedSuggestionIndex);
  const zenMode = useLockinStore((state) => state.zenMode);
  const soundEnabled = useLockinStore((state) => state.soundEnabled);
  const triageSidetracks = useLockinStore((state) => state.triageSidetracks);
  const activeTriageIndex = useLockinStore((state) => state.activeTriageIndex);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const showPanicModal = useLockinStore((state) => state.showPanicModal);
  const elapsed = useLockinStore((state) => state.elapsed);
  const wrapData = useLockinStore((state) => state.wrapData);

  // Select store actions
  const tickElapsed = useLockinStore((state) => state.tickElapsed);
  const setIsSystemDark = useLockinStore((state) => state.setIsSystemDark);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const addToQueue = useLockinStore((state) => state.addToQueue);
  const completeSession = useLockinStore((state) => state.completeSession);
  const addNote = useLockinStore((state) => state.addNote);
  const addTodo = useLockinStore((state) => state.addTodo);
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const toggleTodoTimerByText = useLockinStore((state) => state.toggleTodoTimerByText);
  const removeTodo = useLockinStore((state) => state.removeTodo);
  const addSidetrack = useLockinStore((state) => state.addSidetrack);
  const setDismissedSuggestions = useLockinStore((state) => state.setDismissedSuggestions);
  const setSelectedSuggestionIndex = useLockinStore((state) => state.setSelectedSuggestionIndex);
  const exitWrapMode = useLockinStore((state) => state.exitWrapMode);
  const setShowHistoryPanel = useLockinStore((state) => state.setShowHistoryPanel);
  const setShowInboxPanel = useLockinStore((state) => state.setShowInboxPanel);
  const setShowTasksPanel = useLockinStore((state) => state.setShowTasksPanel);
  const setTheme = useLockinStore((state) => state.setTheme);
  const deleteQueueItem = useLockinStore((state) => state.deleteQueueItem);
  const deleteIdleSidetrack = useLockinStore((state) => state.deleteIdleSidetrack);
  const toggleZenMode = useLockinStore((state) => state.toggleZenMode);
  const setSoundEnabled = useLockinStore((state) => state.setSoundEnabled);
  const setResumeCueToLastSession = useLockinStore((state) => state.setResumeCueToLastSession);
  const processCurrentTriage = useLockinStore((state) => state.processCurrentTriage);
  const showHelp = useLockinStore((state) => state.showHelp);
  const toggleHelp = useLockinStore((state) => state.toggleHelp);
  const setShowHelp = useLockinStore((state) => state.setShowHelp);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  const setSelectedRevisionIndex = useLockinStore((state) => state.setSelectedRevisionIndex);
  const setPanicTimer = useLockinStore((state) => state.setPanicTimer);
  const setSessionTimer = useLockinStore((state) => state.setSessionTimer);
  const setShowPanicModal = useLockinStore((state) => state.setShowPanicModal);
  const setShowRecurrenceModal = useLockinStore((state) => state.setShowRecurrenceModal);
  const setupStep = useLockinStore((state) => state.setupStep);
  const setupTaskName = useLockinStore((state) => state.setupTaskName);
  const initiateSessionSetup = useLockinStore((state) => state.initiateSessionSetup);
  const submitSetupEstimate = useLockinStore((state) => state.submitSetupEstimate);
  const submitSetupEnergy = useLockinStore((state) => state.submitSetupEnergy);
  const cancelSessionSetup = useLockinStore((state) => state.cancelSessionSetup);
  const addCallback = useLockinStore((state) => state.addCallback);
  const checkCallbacks = useLockinStore((state) => state.checkCallbacks);
  const toggleCallbacksPanel = useLockinStore((state) => state.toggleCallbacksPanel);
  const showCallbacksPanel = useLockinStore((state) => state.showCallbacksPanel);
  const toggleSchedulesPanel = useLockinStore((state) => state.toggleSchedulesPanel);
  const showSchedulesPanel = useLockinStore((state) => state.showSchedulesPanel);
  const deleteCallbackByIndex = useLockinStore((state) => state.deleteCallbackByIndex);
  const deleteScheduleByIndex = useLockinStore((state) => state.deleteScheduleByIndex);
  const showArchivesPanel = useLockinStore((state) => state.showArchivesPanel);
  const toggleArchivesPanel = useLockinStore((state) => state.toggleArchivesPanel);
  const setArchiveConfirmPending = useLockinStore((state) => state.setArchiveConfirmPending);
  const createArchive = useLockinStore((state) => state.createArchive);
  const stash = useLockinStore((state) => state.stash);
  const popStash = useLockinStore((state) => state.popStash);
  const discardStash = useLockinStore((state) => state.discardStash);
  const closeArchive = useLockinStore((state) => state.closeArchive);
  const activeArchiveId = useLockinStore((state) => state.activeArchiveId);
  const toggleStarSession = useLockinStore((state) => state.toggleStarSession);
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

  // Active Timer Effect & Callback Checker
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (mode === "active" || mode === "panic") {
        tickElapsed();
      }
      checkCallbacks();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [mode, tickElapsed, checkCallbacks]);

  // Panic Ticks and Alarm sound effect
  useEffect(() => {
    const isPanic = mode === "panic" && session?.panicEndElapsed !== undefined;
    const isTimer = mode === "active" && session?.timerEndElapsed !== undefined;

    if (isPanic || isTimer) {
      const endElapsed = isPanic ? session!.panicEndElapsed! : session!.timerEndElapsed!;
      const remaining = endElapsed - elapsed;
      if (remaining === 120) {
        if (soundEnabled) {
          try { playThemeWarningSound(); } catch (e) { }
        }
      }
      if (remaining === 0) {
        if (soundEnabled) {
          try { playThemePanicExpiredAlarm(); } catch (e) { }
        }
      } else if (remaining < 0) {
        // Overtime beep alarm every 10 seconds
        if (remaining % 10 === 0 && soundEnabled) {
          try { playThemePanicExpiredAlarm(); } catch (e) { }
        }
      } else if (remaining <= 15) {
        // Play click tick every second for critical urgency
        if (soundEnabled) {
          try { playThemeTickSound(); } catch (e) { }
        }
      } else if (remaining <= 30) {
        // Play click tick every 3 seconds for mild warning
        if (remaining % 3 === 0 && soundEnabled) {
          try { playThemeTickSound(); } catch (e) { }
        }
      }
    }
  }, [elapsed, mode, session, soundEnabled]);

  // Keyboard Event Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape Key Behavior
    if (e.key === "Escape") {
      if (showHelp) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }
      if (mode === "panic" && session?.panicEndElapsed !== undefined && showPanicModal) {
        e.preventDefault();
        setShowPanicModal(false);
        setToastMsg("Minimized focus modal. Click floating timer to reopen.");
        return;
      }
    }
  };

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
