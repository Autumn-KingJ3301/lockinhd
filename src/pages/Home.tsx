import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { parseCommand, getCommandSplit, parseDuration } from "../utils/commandParser";
import { generateMarkdownExport } from "../utils/markdownExporter";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCloudSync } from "../hooks/useCloudSync";
import type { Theme } from "../types";
import { Toolbar } from "../components/Toolbar";
import { HistoryPanel } from "../components/HistoryPanel";
import { InboxPanel } from "../components/InboxPanel";
import { CoreLockin } from "../components/CoreLockin";
import { FloatingTimer } from "../components/FloatingTimer";
import { PanicModal } from "../components/PanicModal";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { playTickSound, playPanicExpiredAlarm } from "../utils/audioSynth";
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

  // Select store actions
  const tickElapsed = useLockinStore((state) => state.tickElapsed);
  const rehydrateTimer = useLockinStore((state) => state.rehydrateTimer);
  const setIsSystemDark = useLockinStore((state) => state.setIsSystemDark);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const addToQueue = useLockinStore((state) => state.addToQueue);
  const startSession = useLockinStore((state) => state.startSession);
  const startNextQueuedTask = useLockinStore((state) => state.startNextQueuedTask);
  const completeSession = useLockinStore((state) => state.completeSession);
  const addNote = useLockinStore((state) => state.addNote);
  const addTodo = useLockinStore((state) => state.addTodo);
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const removeTodo = useLockinStore((state) => state.removeTodo);
  const addSidetrack = useLockinStore((state) => state.addSidetrack);
  const setDismissedSuggestions = useLockinStore((state) => state.setDismissedSuggestions);
  const setSelectedSuggestionIndex = useLockinStore((state) => state.setSelectedSuggestionIndex);
  const exitWrapMode = useLockinStore((state) => state.exitWrapMode);
  const setShowHistoryPanel = useLockinStore((state) => state.setShowHistoryPanel);
  const setShowInboxPanel = useLockinStore((state) => state.setShowInboxPanel);
  const setTheme = useLockinStore((state) => state.setTheme);
  const continueSession = useLockinStore((state) => state.continueSession);
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
  const cancelPanicTimer = useLockinStore((state) => state.cancelPanicTimer);
  const setShowPanicModal = useLockinStore((state) => state.setShowPanicModal);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth Protection
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Rehydrate timer offset from session start timestamp on mount
  useEffect(() => {
    rehydrateTimer();
  }, [rehydrateTimer]);

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
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => {
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [showHistoryPanel, showInboxPanel, setShowHistoryPanel, setShowInboxPanel]);

  // Active Timer Effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (mode === "active") {
      intervalId = setInterval(() => {
        tickElapsed();
      }, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [mode, tickElapsed]);

  // Panic Ticks and Alarm sound effect
  useEffect(() => {
    if (mode === "active" && session?.panicEndElapsed !== undefined) {
      const remaining = session.panicEndElapsed - elapsed;
      if (remaining === 0) {
        if (soundEnabled) {
          try { playPanicExpiredAlarm(); } catch (e) {}
        }
      } else if (remaining < 0) {
        // Overtime beep alarm every 10 seconds
        if (remaining % 10 === 0 && soundEnabled) {
          try { playPanicExpiredAlarm(); } catch (e) {}
        }
      } else if (remaining <= 15) {
        // Play click tick every second for critical urgency
        if (soundEnabled) {
          try { playTickSound(); } catch (e) {}
        }
      } else if (remaining <= 30) {
        // Play click tick every 3 seconds for mild warning
        if (remaining % 3 === 0 && soundEnabled) {
          try { playTickSound(); } catch (e) {}
        }
      }
    }
  }, [elapsed, mode, session?.panicEndElapsed, soundEnabled]);

  // Suggestions — sourced from shared utility (single source of truth)
  const commandSuggestions = getCommandSuggestions(mode, sessions, queue, idleSidetracks, session, selectedHistorySession, input);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);

  const showSuggestions =
    filteredSuggestions.length > 0 && input.startsWith("/") && !dismissedSuggestions;

  // Reset suggestions dismissed status when input changes
  useEffect(() => {
    if (!input.startsWith("/")) {
      setDismissedSuggestions(false);
      setSelectedSuggestionIndex(0);
    }
  }, [input, setDismissedSuggestions, setSelectedSuggestionIndex]);

  // Clamp selection index on filter length changes
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [filteredSuggestions.length, setSelectedSuggestionIndex]);

  // Keyboard Event Handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (mode === "active" && session?.panicEndElapsed !== undefined && showPanicModal) {
        e.preventDefault();
        setShowPanicModal(false);
        setToastMsg("Minimized focus modal. Click floating timer to reopen.");
        return;
      }
    }

    if (e.key === "Backspace" && input.startsWith("/")) {
      const split = getCommandSplit(input);
      if (split && split.argsPart === "") {
        e.preventDefault();
        setInput(split.commandPart);
        return;
      }
    }

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((selectedSuggestionIndex + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex(
          (selectedSuggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selectedCmd = filteredSuggestions[selectedSuggestionIndex];
        if (input === selectedCmd.command) {
          handleEnterSubmit();
        } else {
          setInput(selectedCmd.command);
        }
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const selectedCmd = filteredSuggestions[selectedSuggestionIndex];
        setInput(selectedCmd.command);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissedSuggestions(true);
        return;
      }
    }

    if (e.key === "Tab") {
      if (mode === "idle" && queue.length > 0) {
        e.preventDefault();
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

  const handleEnterSubmit = () => {
    const trimmedInput = input.trim();
    const parsed = parseCommand(input);

    if (parsed) {
      const { cmdName, args } = parsed;

      if (cmdName === "panic") {
        if (mode === "active") {
          const trimmedArg = args.trim().toLowerCase();
          if (trimmedArg === "" || trimmedArg === "extend") {
            // Extend by default 2 minutes (120s)
            setPanicTimer(120, true);
            setToastMsg("Extended panic countdown by 2 minutes!");
          } else if (trimmedArg === "off" || trimmedArg === "cancel" || trimmedArg === "clear" || trimmedArg === "nopanic") {
            cancelPanicTimer();
            setToastMsg("Panic timer disabled.");
          } else {
            const hasSign = args.startsWith("+") || args.startsWith("-");
            const seconds = parseDuration(args);
            if (seconds !== null) {
              if (hasSign) {
                setPanicTimer(seconds, true);
                setToastMsg(seconds > 0 
                  ? `Extended panic countdown by ${formatSummaryDuration(seconds)}!` 
                  : `Reduced panic countdown by ${formatSummaryDuration(Math.abs(seconds))}!`
                );
              } else {
                setPanicTimer(seconds, false);
                setToastMsg(`Panic countdown set to ${formatSummaryDuration(seconds)}!`);
              }
            } else {
              setToastMsg("Invalid duration. E.g. `/panic +5m` or `/panic 10m` or `/panic off`.");
            }
          }
        } else if (mode === "idle") {
          const trimmedArg = args.trim();
          if (trimmedArg === "") {
            setToastMsg("Usage: `/panic [duration] [task]` or `/panic [task]` (e.g. `/panic Clean room.`)");
          } else {
            const spaceIdx = trimmedArg.indexOf(" ");
            let seconds: number | null = null;
            let taskPart = "";

            if (spaceIdx !== -1) {
              const firstWord = trimmedArg.substring(0, spaceIdx);
              const rest = trimmedArg.substring(spaceIdx + 1).trim();
              const parsedSecs = parseDuration(firstWord);
              if (parsedSecs !== null) {
                seconds = parsedSecs;
                taskPart = rest;
              } else {
                seconds = 300; // Default 5 minutes
                taskPart = trimmedArg;
              }
            } else {
              // No space
              const parsedSecs = parseDuration(trimmedArg);
              if (parsedSecs !== null) {
                // It's just a duration, e.g. "/panic 5"
                setToastMsg("Specify a task: `/panic [duration] [task]`");
                setInput("");
                return;
              } else {
                seconds = 300; // Default 5 minutes
                taskPart = trimmedArg;
              }
            }

            if (taskPart !== "") {
              startSession(taskPart);
              setPanicTimer(seconds);
              setToastMsg(`Started "${taskPart}" with ${formatSummaryDuration(seconds)} panic!`);
            }
          }
        }
        setInput("");
        return;
      }

      if (cmdName === "minimize") {
        if (mode === "active") {
          setShowPanicModal(false);
          setToastMsg("Minimized focus modal. Click floating timer to reopen.");
        } else {
          setToastMsg("Minimize only works during active sessions.");
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

      if (cmdName === "inbox") {
        setShowInboxPanel(!showInboxPanel);
        setInput("");
        return;
      }

      if (cmdName === "theme") {
        const lowerArg = args.toLowerCase();
        if (lowerArg === "light" || lowerArg === "dark" || lowerArg === "system") {
          setTheme(lowerArg);
        } else if (!lowerArg) {
          const modes: Theme[] = ["system", "light", "dark"];
          const nextIdx = (modes.indexOf(theme) + 1) % modes.length;
          setTheme(modes[nextIdx]);
        } else {
          setToastMsg("Invalid theme. Use light, dark, or system.");
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
          continueSession(sessions[sessions.length - 1]);
          setToastMsg("Resumed last focus session.");
        } else {
          const index = parseInt(args, 10);
          if (!isNaN(index) && index >= 1 && index <= sessions.length) {
            continueSession(sessions[sessions.length - index]);
            setToastMsg(`Resumed session: ${sessions[sessions.length - index].task}`);
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

      if (mode === "active" && session) {
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

      // Starts with '/' but unrecognized/invalid command for the current mode
      setInput("");
      return;
    }

    // Default regular text submission (non-slash commands)
    if (mode === "idle") {
      if (trimmedInput) {
        startSession(trimmedInput);
      }
    } else if (mode === "active") {
      if (trimmedInput) {
        addNote(trimmedInput);
        setInput("");
      }
    } else if (mode === "wrap") {
      const triageActive = triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length;
      if (triageActive) {
        // In triage mode, Enter means "keep in inbox"
        processCurrentTriage("keep");
        setInput("");
      } else if (trimmedInput === "") {
        // Triage done — exit wrap mode or go to next queued task
        if (queue.length > 0) {
          startNextQueuedTask();
        } else {
          exitWrapMode();
        }
      } else {
        // Save resume cue then clear wrap (or start new session)
        setResumeCueToLastSession(trimmedInput);
        setToastMsg("Resume cue saved! Starting fresh.");
        exitWrapMode();
      }
    }
  };

  // Determine input values based on current state & mode
  let placeholderText = "";
  let hintText = "";

  if (mode === "idle") {
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
      placeholderText = "type resume cue + ↵ to save, or ↵ to start next";
      hintText = "type where to pick up next time, then ↵";
    } else {
      placeholderText = "type a resume cue + ↵, or just ↵ to go idle";
      hintText = "leave a breadcrumb for your next session, then ↵";
    }
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
      {/* Utility Toolbar */}
      <Toolbar />

      <div className={`workspace-wrapper${zenMode ? " zen-layout" : ""}`}>
        {/* Left Column: History Panel */}
        {showHistoryPanel && (
          <div className={`panel-slide${zenMode ? " zen-hidden" : ""}`}>
            <HistoryPanel />
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
      </div>

      {/* Panic Modal Overlay */}
      <PanicModal inputRef={inputRef} handleKeyDown={handleKeyDown} />

      {/* Floating Timer (visible during active session) */}
      <FloatingTimer />
    </>
  );
};
