import { useEffect, useRef } from "react";
import { parseCommand } from "./utils/commandParser";
import { generateMarkdownExport } from "./utils/markdownExporter";
import { useLockinStore } from "./store/useLockinStore";
import type { Theme } from "./types";
import { Toolbar } from "./components/Toolbar";
import { HistoryPanel } from "./components/HistoryPanel";
import { InboxPanel } from "./components/InboxPanel";
import { CoreLockin } from "./components/CoreLockin";
import { FloatingTimer } from "./components/FloatingTimer";
import { getCommandSuggestions, filterSuggestions } from "./utils/commandSuggestions";

function App() {
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

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Suggestions — sourced from shared utility (single source of truth)
  const commandSuggestions = getCommandSuggestions(mode);
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

    // Close help overlay on Escape
    if (e.key === "Escape" && showHelp) {
      e.preventDefault();
      setShowHelp(false);
      return;
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
      if (e.key === "Enter" || e.key === "Tab") {
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
      handleEnterSubmit();
    }
  };

  const handleEnterSubmit = () => {
    const trimmedInput = input.trim();
    const parsed = parseCommand(input);

    if (parsed) {
      const { cmdName, args } = parsed;

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

      {/* Floating Timer (visible during active session) */}
      <FloatingTimer />
    </>
  );
}

export default App;
