import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getParsedCommand, parseDuration, commandRegistry } from "../utils/commandParser";
import { generateMarkdownExport } from "../utils/markdownExporter";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useCloudSync } from "../hooks/useCloudSync";
import type { Theme } from "../types";
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
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { playThemeTickSound, playThemePanicExpiredAlarm, playThemeWarningSound } from "../utils/audioSynth";
import { formatSummaryDuration } from "../utils/timeFormatters";

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
        toggleTrace(false);
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [showHistoryPanel, showInboxPanel, setShowHistoryPanel, setShowInboxPanel]);

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

  // Suggestions — sourced from shared utility (single source of truth)
  const commandSuggestions = getCommandSuggestions(mode, sessions, queue, idleSidetracks, session, selectedHistorySession, input);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);

  const showSuggestions =
    filteredSuggestions.length > 0 && input.startsWith("/") && !dismissedSuggestions;

  // Reset suggestions dismissed status when input changes
  useEffect(() => {
    if (!input.startsWith("/")) {
      setDismissedSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [input, setDismissedSuggestions, setSelectedSuggestionIndex]);

  // Clamp selection index on filter length changes
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [filteredSuggestions.length, setSelectedSuggestionIndex]);

  // Keyboard Event Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (setupStep !== "idle") {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelSessionSetup();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (setupStep === "estimate") {
          submitSetupEstimate(input);
        } else if (setupStep === "energy") {
          submitSetupEnergy(input);
        }
        return;
      }
    }

    // Wrap-mode triage: single-key shortcuts when triaging sidetracks
    const triageActive = mode === "wrap" && triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length;
    if (triageActive && !input) {
      const key = e.key.toLowerCase();
      if (key === "q") {
        e.preventDefault();
        processCurrentTriage("queue");
        setToastMsg("Added to queue!");
        return;
      }
      if (key === "s") {
        e.preventDefault();
        processCurrentTriage("start");
        setToastMsg("Moved to top of queue — starts next!");
        return;
      }
      if (key === "d") {
        e.preventDefault();
        processCurrentTriage("delete");
        setToastMsg("Discarded.");
        return;
      }
    }

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

    if (e.key === "Backspace" && input.startsWith("/")) {
      const parsed = getParsedCommand(input);
      if (parsed && parsed.remainingInput === "") {
        e.preventDefault();
        // Remove the last token
        const newTokens = parsed.tokens.slice(0, -1);
        const newInput = newTokens.map(t => (t.type === "command" ? "/" : "") + t.value).join("\x1f");
        setInput(newInput + (newTokens.length > 0 ? "\x1f" : ""));
        return;
      }
    }

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = selectedSuggestionIndex === -1 ? 0 : (selectedSuggestionIndex + 1) % filteredSuggestions.length;
        setSelectedSuggestionIndex(nextIdx);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextIdx = selectedSuggestionIndex === -1 ? filteredSuggestions.length - 1 : (selectedSuggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
        setSelectedSuggestionIndex(nextIdx);
        return;
      }
      if (e.key === "Enter") {
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          const selectedCmd = filteredSuggestions[selectedSuggestionIndex];
          // Process the selected suggestion through handleEnterSubmit for immediate chipping/execution
          handleEnterSubmit(selectedCmd.command);
          return;
        }
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const selectedIdx = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
        const selectedCmd = filteredSuggestions[selectedIdx];
        setInput(selectedCmd.command + "\x1f");
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissedSuggestions(true);
        return;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (input.startsWith("/")) {
        handleTabSubmit();
      } else if (mode === "idle" && queue.length > 0) {
        setInput(queue[0].text);
      }
    } else if (e.key === "Enter") {
      if (selectedHistorySession && input === "") {
        e.preventDefault();
        const idx = sessions.findIndex(
          (s) => (s.id || s.startTime) === (selectedHistorySession.id || selectedHistorySession.startTime)
        );
        if (idx !== -1) {
          setInput(`/continue ${sessions.length - idx}`);
          return;
        }
      }
      handleEnterSubmit();
    } else if (e.key === "Escape" && selectedHistorySession) {
      e.preventDefault();
      setSelectedHistorySession(null);
    }
  };

  const handleTabSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput.startsWith("/")) return;

    const parsedResult = getParsedCommand(input);

    if (!parsedResult) {
      const cmdName = trimmedInput.substring(1).split("\x1f")[0].toLowerCase();
      const schema = commandRegistry.find(s => s.name === cmdName || s.shortcuts?.includes(cmdName));
      if (schema) {
        setInput("/" + schema.name + "\x1f");
      }
      return;
    }

    const { remainingInput } = parsedResult;

    if (remainingInput.trim() !== "") {
      setInput(input + "\x1f");
    }
  };

  const handleEnterSubmit = (overrideInput?: string) => {
    const targetInput = overrideInput ?? input;
    const trimmedInput = targetInput.trim();
    if (!trimmedInput.startsWith("/")) {
      if (mode === "idle") {
        if (trimmedInput) {
          initiateSessionSetup(trimmedInput);
        } else if (queue.length > 0) {
          const nextTask = queue[0];
          deleteQueueItem(nextTask.id);
          initiateSessionSetup(nextTask.text);
        }
      } else if (mode === "active" || mode === "panic") {
        if (trimmedInput) {
          addNote(trimmedInput);
          setInput("");
        }
      } else if (mode === "wrap") {
        const triageActive = triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length;
        if (triageActive) {
          processCurrentTriage("keep");
          setInput("");
        } else if (trimmedInput === "") {
          exitWrapMode();
        } else {
          setResumeCueToLastSession(trimmedInput);
          setToastMsg("Resume cue saved! Starting fresh.");
          exitWrapMode();
        }
      }
      return;
    }

    const parsedResult = getParsedCommand(targetInput);

    if (!parsedResult) {
      // Command not chipped yet. Check if it's a valid command.
      const cmdName = trimmedInput.substring(1).split("\x1f")[0].toLowerCase();
      const schema = commandRegistry.find(s => s.name === cmdName || s.shortcuts?.includes(cmdName));
      if (schema) {
        if (schema.args.length === 0) {
          // Zero-arg command like /done or /help execute immediately
          executeCommand(schema, [], "");
        } else {
          // Has args, chip the command first by adding a \x1f
          setInput("/" + schema.name + "\x1f");
        }
      } else {
        // Unknown command
        setInput("");
      }
      return;
    }

    const { schema, tokens, remainingInput, nextArg } = parsedResult;

    if (remainingInput.trim() !== "") {
      // We have text typed but not chipped. 
      // If it's the LAST argument, we can execute immediately.
      const isLastArg = tokens.length - 1 === schema.args.length - 1;

      if (isLastArg) {
        // Build tokens with the final argument
        const finalTokens = [...tokens, { type: "arg", value: remainingInput.trim(), schema: nextArg, category: schema.category }];
        const args = finalTokens.slice(1).map(t => (t as any).value).join(" ");
        executeCommand(schema, finalTokens, args);
      } else {
        // Commit it by adding a \x1f (will chip on next render)
        setInput(targetInput + "\x1f");
      }
    } else {
      // No remaining input text. 
      // If the command is complete (or arguments are optional), execute.
      const args = tokens.slice(1).map(t => t.value).join(" ");
      executeCommand(schema, tokens, args);
    }
  };

  const showTraceInline = useLockinStore((state) => state.showTraceInline);
  const toggleTrace = useLockinStore((state) => state.toggleTrace);

  const executeCommand = (schema: any, tokens: any[], args: string) => {
    const cmdName = schema.name;

    if (cmdName === "trace") {
      toggleTrace(true);
      setInput("");
      return;
    }

    if (cmdName === "trace-resume") {
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        initiateSessionSetup(lastSession.task, { continueSession: lastSession });
        toggleTrace(false);
      } else {
        setToastMsg("No history to resume.");
      }
      setInput("");
      return;
    }

    if (cmdName === "trace-clear") {
      toggleTrace(false);
      setInput("");
      return;
    }

    if (cmdName === "panic") {
      const secondsToken = tokens.find(t => t.schema?.type === "duration");
      const seconds = parseDuration(secondsToken?.value || "2m") || 120;
      const taskToken = tokens.find(t => t.schema?.type === "task");
      const taskName = taskToken?.value || "";

      if (mode === "idle") {
        if (!taskName) {
          setToastMsg("Specify a task: `/panic [time] [task]`");
          return;
        } else {
          initiateSessionSetup(taskName, { panicLimit: seconds });
        }
      } else if (mode === "panic") {
        const hasSign = input.includes("+") || input.includes("-");
        setPanicTimer(seconds, hasSign);
        setToastMsg(seconds > 0 ? `Extended panic by ${formatSummaryDuration(seconds)}` : `Reduced panic by ${formatSummaryDuration(Math.abs(seconds))}`);
      } else {
        setToastMsg("Panic mode only available from idle or during a panic session.");
      }
      setInput("");
      return;
    }

    if (cmdName === "callbacks") {
      toggleCallbacksPanel();
      setInput("");
      return;
    }

    if (cmdName === "schedules") {
      toggleSchedulesPanel();
      setInput("");
      return;
    }

    if (cmdName === "delete-callback") {
      const index = parseInt(args, 10);
      if (!isNaN(index)) {
        deleteCallbackByIndex(index - 1);
      }
      setInput("");
      return;
    }

    if (cmdName === "delete-schedule") {
      const index = parseInt(args, 10);
      if (!isNaN(index)) {
        deleteScheduleByIndex(index - 1);
      }
      setInput("");
      return;
    }

    if (cmdName === "callback") {
      const secondsToken = tokens.find(t => t.schema?.type === "duration");
      const seconds = parseDuration(secondsToken?.value || "2m") || 120;
      const taskToken = tokens.find(t => t.schema?.type === "task");
      const taskName = taskToken?.value || "Unnamed Chore";

      addCallback(taskName, seconds);
      setInput("");
      return;
    }

    if (cmdName === "schedule") {
      const atToken = tokens.find(t => t.schema?.name === "at");
      const taskToken = tokens.find(t => t.schema?.type === "task");
      const isRecurring = input.includes("--recur");
      const taskName = (taskToken?.value || "Scheduled Chore").replace("--recur", "").trim();
      
      if (atToken) {
        // Parse time like "5pm", "17:30", "5:30pm"
        const timeStr = atToken.value.toLowerCase();
        const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
        
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = match[2] ? parseInt(match[2], 10) : 0;
          const ampm = match[3];
          
          if (ampm === "pm" && hours < 12) hours += 12;
          if (ampm === "am" && hours === 12) hours = 0;
          
          const now = new Date();
          const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          
          if (scheduledDate.getTime() < now.getTime()) {
             scheduledDate.setDate(scheduledDate.getDate() + 1);
          }
          
          const taskId = Date.now();
          // We manually call addSchedule with taskId to match the one we might use for the modal
          useLockinStore.getState().addSchedule(taskName, 120, scheduledDate.getTime());
          
          if (isRecurring) {
            useLockinStore.setState({ recurrenceModalTaskId: taskId });
            setShowRecurrenceModal(true);
          }
        } else {
          setToastMsg("Invalid time format. Use HH:MM or 5pm.");
        }
      }
      setInput("");
      return;
    }

    if (cmdName === "timer") {
      if (mode === "active" || mode === "panic") {
        const secondsToken = tokens.find(t => t.schema?.type === "duration");
        const todoToken = tokens.find(t => t.schema?.name === "todo");
        const seconds = parseDuration(secondsToken?.value || "") || 0;
        
        if (todoToken) {
          toggleTodoTimerByText(todoToken.value, seconds > 0 ? seconds : undefined);
          setToastMsg(seconds > 0 
            ? `Sub-timer started for ${formatSummaryDuration(seconds)} on: ${todoToken.value}`
            : `Todo timer toggled for: ${todoToken.value}`
          );
        } else if (seconds > 0) {
          const hasSign = input.includes("+") || input.includes("-");
          setSessionTimer(seconds, hasSign);
          setToastMsg(`Session timer set: ${formatSummaryDuration(seconds)}`);
        } else {
          setToastMsg("Usage: `/timer [duration]` or `/timer [duration] [todo]`");
        }
      } else {
        setToastMsg("/timer only works inside an active or panic session.");
      }
      setInput("");
      return;
    }

    if (cmdName === "minimize") {
      if (mode === "panic") {
        setShowPanicModal(false);
        setToastMsg("Minimized focus modal. Click floating timer to reopen.");
      } else {
        setToastMsg("Minimize only works during panic sessions.");
      }
      setInput("");
      return;
    }

    if (cmdName === "revision") {
      if (selectedHistorySession) {
        if (!args) {
          setSelectedRevisionIndex(null);
          setToastMsg("Showing all revisions (aggregated).");
        } else {
          const revNum = parseInt(args, 10);
          const exists = selectedHistorySession.revisionHistory?.some(r => r.revisionNumber === revNum);
          if (exists) {
            setSelectedRevisionIndex(revNum - 1);
            setToastMsg(`Viewing Revision ${revNum}.`);
          } else {
            setToastMsg(`Revision ${revNum} not found.`);
          }
        }
      } else {
        setToastMsg("Please select a session from history first.");
      }
      setInput("");
      return;
    }

    if (cmdName === "profile") {
      navigate("/profile");
      setInput("");
      return;
    }

    if (cmdName === "archive") {
      const workspaceEmpty =
        sessions.length === 0 && queue.length === 0 && idleSidetracks.length === 0;
      if (workspaceEmpty) {
        setToastMsg("Workspace is already empty — nothing to archive.");
      } else {
        // args contains optional label
        if (args.trim()) {
          // Immediate archive with label (no confirm needed when label provided)
          createArchive(args.trim());
          setToastMsg(`Workspace archived as "${args.trim()}" ✓`);
        } else {
          setArchiveConfirmPending(true);
        }
      }
      setInput("");
      return;
    }

    if (cmdName === "archives") {
      toggleArchivesPanel();
      setInput("");
      return;
    }

    if (cmdName === "stash-pop") {
      if (!stash) {
        setToastMsg("No stash to pop.");
      } else {
        popStash();
        setToastMsg("Stash popped!");
      }
      setInput("");
      return;
    }

    if (cmdName === "stash-discard") {
      if (!stash) {
        setToastMsg("No stash to discard.");
      } else {
        discardStash();
        setToastMsg("Stash discarded.");
      }
      setInput("");
      return;
    }

    if (cmdName === "close-archive") {
      if (!activeArchiveId) {
        setToastMsg("No active archive being viewed.");
      } else {
        closeArchive();
        setToastMsg("Archive closed.");
      }
      setInput("");
      return;
    }

    if (cmdName === "export") {
      const md = generateMarkdownExport(sessions, idleSidetracks);
      navigator.clipboard.writeText(md)
        .then(() => setToastMsg("Copied focus log to clipboard!"))
        .catch(() => setToastMsg("Copy failed."));
      setInput("");
      return;
    }

    if (cmdName === "sidetrack") {
      if (args) {
        addSidetrack(args);
        setToastMsg(mode === "active" ? "Captured sidetrack inside session!" : "Captured sidetrack in inbox!");
      }
      setInput("");
      return;
    }

    if (cmdName === "add") {
      if (args) {
        addToQueue(args);
      }
      setInput("");
      return;
    }

    if (cmdName === "history") {
      setShowHistoryPanel(!showHistoryPanel);
      setInput("");
      return;
    }

    if (cmdName === "tasks") {
      setShowTasksPanel(!showTasksPanel);
      setInput("");
      return;
    }

    if (cmdName === "inbox") {
      setShowInboxPanel(!showInboxPanel);
      setInput("");
      return;
    }

    if (cmdName === "theme") {
      const lowerArg = args.trim().toLowerCase();
      if (lowerArg === "light" || lowerArg === "dark" || lowerArg === "system") {
        setTheme(lowerArg as Theme);
        setToastMsg(`Interface theme set to ${lowerArg}`);
      } else if (lowerArg === "default") {
        try {
          useThemeStore.getState().applyTheme("default");
          setToastMsg("Panic skin reset to default");
        } catch (e: any) {
          setToastMsg(e.message);
        }
      } else if (lowerArg) {
        try {
          useThemeStore.getState().applyTheme(lowerArg);
          const active = useThemeStore.getState().getActiveTheme();
          setToastMsg(`Panic skin set to ${active?.name || lowerArg}`);
        } catch (e: any) {
          setToastMsg(e.message || `Theme '${args}' not found.`);
        }
      } else {
        const modes: Theme[] = ["system", "light", "dark"];
        const nextIdx = (modes.indexOf(theme) + 1) % modes.length;
        setTheme(modes[nextIdx]);
        setToastMsg(`Interface theme toggled to ${modes[nextIdx]}`);
      }
      setInput("");
      return;
    }

    if (cmdName === "themes") {
      setToastMsg("Opening Theme Store...");
      setInput("");
      setTimeout(() => {
        navigate("/themes");
      }, 300);
      return;
    }

    if (cmdName === "journal") {
      setToastMsg("Opening Journal...");
      setInput("");
      setTimeout(() => {
        navigate("/journal");
      }, 300);
      return;
    }

    if (cmdName === "theme-install") {
      if (!args.trim()) {
        setToastMsg("Usage: /theme-install [JSON theme]");
        setInput("");
        return;
      }
      try {
        const theme = useThemeStore.getState().installTheme(args);
        setToastMsg(`Successfully installed skin: ${theme.name}! Type '/theme ${theme.id}' to apply.`);
      } catch (e: any) {
        setToastMsg(`Installation failed: ${e.message}`);
      }
      setInput("");
      return;
    }

    if (cmdName === "theme-uninstall") {
      if (!args.trim()) {
        setToastMsg("Usage: /theme-uninstall [themeId]");
        setInput("");
        return;
      }
      try {
        useThemeStore.getState().uninstallTheme(args.trim());
        setToastMsg(`Successfully uninstalled skin: ${args.trim()}`);
      } catch (e: any) {
        setToastMsg(`Uninstall failed: ${e.message}`);
      }
      setInput("");
      return;
    }

    if (cmdName === "zen") {
      toggleZenMode();
      setToastMsg(zenMode ? "Zen mode off — panels restored." : "Zen mode on — panels hidden.");
      setInput("");
      return;
    }

    if (cmdName === "sound") {
      setSoundEnabled(!soundEnabled);
      setToastMsg(soundEnabled ? "Sound feedback disabled." : "Sound feedback enabled!");
      setInput("");
      return;
    }

    if (cmdName === "help") {
      toggleHelp();
      setInput("");
      return;
    }

    if (cmdName === "continue") {
      if (sessions.length === 0) {
        setToastMsg("No completed sessions in history to continue.");
        setInput("");
        return;
      }
      if (!args) {
        initiateSessionSetup(sessions[sessions.length - 1].task, { continueSession: sessions[sessions.length - 1] });
        setToastMsg("Resuming last focus session...");
      } else {
        const index = parseInt(args, 10);
        if (!isNaN(index) && index >= 1 && index <= sessions.length) {
          initiateSessionSetup(sessions[sessions.length - index].task, { continueSession: sessions[sessions.length - index] });
          setToastMsg(`Resuming session: ${sessions[sessions.length - index].task}...`);
        } else {
          setToastMsg(`Invalid session index. Provide 1 to ${sessions.length}.`);
        }
      }
      setInput("");
      return;
    }

    if (cmdName === "remove-queue") {
      if (queue.length === 0) {
        setToastMsg("Queue is empty.");
        setInput("");
        return;
      }
      const index = parseInt(args, 10);
      if (!isNaN(index) && index >= 1 && index <= queue.length) {
        const item = queue[index - 1];
        deleteQueueItem(item.id);
        setToastMsg(`Removed from queue: ${item.text}`);
      } else {
        setToastMsg(`Invalid queue index. Provide 1 to ${queue.length}.`);
      }
      setInput("");
      return;
    }

    if (cmdName === "delete-idea") {
      if (idleSidetracks.length === 0) {
        setToastMsg("Inbox is empty.");
        setInput("");
        return;
      }
      const index = parseInt(args, 10);
      if (!isNaN(index) && index >= 1 && index <= idleSidetracks.length) {
        const idea = idleSidetracks[index - 1];
        deleteIdleSidetrack(index - 1);
        setToastMsg(`Removed idea: ${idea}`);
      } else {
        setToastMsg(`Invalid idea index. Provide 1 to ${idleSidetracks.length}.`);
      }
      setInput("");
      return;
    }

    if ((mode === "active" || mode === "panic") && session) {
      if (cmdName === "todo") {
        if (args) {
          addTodo(args);
        }
        setInput("");
        return;
      }

      if (cmdName === "check") {
        if (args === "") {
          toggleTodo(-1);
        } else {
          const index = parseInt(args, 10);
          if (!isNaN(index)) {
            toggleTodo(index - 1);
          }
        }
        setInput("");
        return;
      }

      if (cmdName === "remove") {
        const index = parseInt(args, 10);
        if (!isNaN(index)) {
          removeTodo(index - 1);
        }
        setInput("");
        return;
      }

      if (cmdName === "done") {
        completeSession();
        return;
      }
    }

    // Unrecognized for current mode
    setInput("");
  };

  // Determine input values based on current state & mode
  let placeholderText = "";
  let hintText = "";

  if (setupStep !== "idle") {
    if (setupStep === "estimate") {
      placeholderText = "estimate duration: e.g. 25m, 1h, or skip with enter";
      hintText = `estimating duration for "${setupTaskName}"  ·  type time + ↵  ·  ↵ to skip  ·  esc to cancel`;
    } else if (setupStep === "energy") {
      placeholderText = "energy check-in: type 1 (low) to 5 (high), or skip";
      hintText = `vibe check (1-5) + ↵  ·  ↵ to skip  ·  esc to cancel`;
    }
  } else if (mode === "idle") {
    if (queue.length > 0) {
      placeholderText = "↵ to start · tab to fill queue item";
    } else {
      placeholderText = "what are you locking in on?";
    }
    hintText = "type task name + ↵ to start  ·  /add <task> to queue  ·  tab to autofill queue";
  } else if (mode === "active") {
    placeholderText = "drop a note...";
    hintText = "type note + ↵ to log  ·  /done (or /d) to end  ·  /add <task> to queue";
  } else if (mode === "wrap") {
    const triageActive = triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length;
    if (triageActive) {
      placeholderText = "[Q] queue  [S] start next  [D] delete  [↵] keep in inbox";
      hintText = `triaging sidetrack ${activeTriageIndex + 1} of ${triageSidetracks.length} — press a key`;
    } else if (queue.length > 0) {
      placeholderText = "type resume cue + ↵ to save, or ↵ to go idle";
      hintText = "type where to pick up next time, then ↵ (or just ↵ to go idle)";
    } else {
      placeholderText = "type a resume cue + ↵, or just ↵ to go idle";
      hintText = "leave a breadcrumb for your next session, then ↵";
    }
  }

  // Override hintText for specific commands
  if (input.startsWith("/schedule")) {
    hintText = "e.g., /schedule 5pm water plants --recur · formats: 5pm, 17:30, 5:30pm";
  } else if (input.startsWith("/callback") || input.startsWith("/cb")) {
    hintText = "e.g., /callback 5m call mom · chore starts after current session";
  }

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

        {/* Center Column: Main Lockin Box */}
        <CoreLockin
          inputRef={inputRef}
          handleKeyDown={handleKeyDown}
          placeholderText={placeholderText}
          hintText={hintText}
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
      <PanicModal inputRef={inputRef} handleKeyDown={handleKeyDown} />

      {/* Recurrence Modal Overlay */}
      <RecurrenceModal />

      {/* Floating Timer (visible during active session) */}
      <FloatingTimer />
    </>
  );
};
