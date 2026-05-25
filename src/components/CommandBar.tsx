import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useThemeStore } from "../store/useThemeStore";
import { SuggestionsOverlay } from "./SuggestionsOverlay";
import { getParsedCommand, parseDuration, commandRegistry } from "../utils/commandParser";
import { getCommandSuggestions, filterSuggestions } from "../utils/commandSuggestions";
import { formatTime, formatPanicTime, formatSummaryDuration } from "../utils/timeFormatters";
import { generateMarkdownExport } from "../utils/markdownExporter";
import type { Theme } from "../types";

interface CommandBarProps {
  compact?: boolean;
  className?: string;
}

export const CommandBar = React.forwardRef<HTMLInputElement, CommandBarProps>(({ compact, className }, ref) => {
  const navigate = useNavigate();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

  const mode = useLockinStore((state) => state.mode);
  const input = useLockinStore((state) => state.input);
  const setInput = useLockinStore((state) => state.setInput);
  const queue = useLockinStore((state) => state.queue);
  const sessions = useLockinStore((state) => state.sessions);
  const session = useLockinStore((state) => state.session);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const elapsed = useLockinStore((state) => state.elapsed);
  const setupStep = useLockinStore((state) => state.setupStep);
  const setupTaskName = useLockinStore((state) => state.setupTaskName);
  const selectedHistorySession = useLockinStore((state) => state.selectedHistorySession);
  const dismissedSuggestions = useLockinStore((state) => state.dismissedSuggestions);
  const selectedSuggestionIndex = useLockinStore((state) => state.selectedSuggestionIndex);
  const setDismissedSuggestions = useLockinStore((state) => state.setDismissedSuggestions);
  const setSelectedSuggestionIndex = useLockinStore((state) => state.setSelectedSuggestionIndex);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);
  const zenMode = useLockinStore((state) => state.zenMode);
  const showHelp = useLockinStore((state) => state.showHelp);
  const toggleHelp = useLockinStore((state) => state.toggleHelp);
  const setShowHelp = useLockinStore((state) => state.setShowHelp);
  const setSelectedRevisionIndex = useLockinStore((state) => state.setSelectedRevisionIndex);
  const setSelectedHistorySession = useLockinStore((state) => state.setSelectedHistorySession);
  
  const initiateSessionSetup = useLockinStore((state) => state.initiateSessionSetup);
  const cancelSessionSetup = useLockinStore((state) => state.cancelSessionSetup);
  const submitSetupEstimate = useLockinStore((state) => state.submitSetupEstimate);
  const submitSetupEnergy = useLockinStore((state) => state.submitSetupEnergy);
  const addNote = useLockinStore((state) => state.addNote);
  const deleteQueueItem = useLockinStore((state) => state.deleteQueueItem);
  const exitWrapMode = useLockinStore((state) => state.exitWrapMode);
  const setResumeCueToLastSession = useLockinStore((state) => state.setResumeCueToLastSession);
  const processCurrentTriage = useLockinStore((state) => state.processCurrentTriage);
  const triageSidetracks = useLockinStore((state) => state.triageSidetracks);
  const activeTriageIndex = useLockinStore((state) => state.activeTriageIndex);
  const completeSession = useLockinStore((state) => state.completeSession);
  const setPanicTimer = useLockinStore((state) => state.setPanicTimer);
  const setSessionTimer = useLockinStore((state) => state.setSessionTimer);
  const setShowPanicModal = useLockinStore((state) => state.setShowPanicModal);
  const showPanicModal = useLockinStore((state) => state.showPanicModal);
  const setShowHistoryPanel = useLockinStore((state) => state.setShowHistoryPanel);
  const showHistoryPanel = useLockinStore((state) => state.showHistoryPanel);
  const setShowInboxPanel = useLockinStore((state) => state.setShowInboxPanel);
  const showInboxPanel = useLockinStore((state) => state.showInboxPanel);
  const setShowTasksPanel = useLockinStore((state) => state.setShowTasksPanel);
  const showTasksPanel = useLockinStore((state) => state.showTasksPanel);
  const toggleCallbacksPanel = useLockinStore((state) => state.toggleCallbacksPanel);
  const toggleSchedulesPanel = useLockinStore((state) => state.toggleSchedulesPanel);
  const deleteCallbackByIndex = useLockinStore((state) => state.deleteCallbackByIndex);
  const deleteScheduleByIndex = useLockinStore((state) => state.deleteScheduleByIndex);
  const addCallback = useLockinStore((state) => state.addCallback);
  const toggleTodoTimerByText = useLockinStore((state) => state.toggleTodoTimerByText);
  const createArchive = useLockinStore((state) => state.createArchive);
  const setArchiveConfirmPending = useLockinStore((state) => state.setArchiveConfirmPending);
  const toggleArchivesPanel = useLockinStore((state) => state.toggleArchivesPanel);
  const stash = useLockinStore((state) => state.stash);
  const popStash = useLockinStore((state) => state.popStash);
  const discardStash = useLockinStore((state) => state.discardStash);
  const closeArchive = useLockinStore((state) => state.closeArchive);
  const activeArchiveId = useLockinStore((state) => state.activeArchiveId);
  const addSidetrack = useLockinStore((state) => state.addSidetrack);
  const addToQueue = useLockinStore((state) => state.addToQueue);
  const setTheme = useLockinStore((state) => state.setTheme);
  const theme = useLockinStore((state) => state.theme);
  const toggleZenMode = useLockinStore((state) => state.toggleZenMode);
  const soundEnabled = useLockinStore((state) => state.soundEnabled);
  const setSoundEnabled = useLockinStore((state) => state.setSoundEnabled);
  const toggleStarSession = useLockinStore((state) => state.toggleStarSession);
  const addTodo = useLockinStore((state) => state.addTodo);
  const toggleTodo = useLockinStore((state) => state.toggleTodo);
  const removeTodo = useLockinStore((state) => state.removeTodo);
  const toggleTrace = useLockinStore((state) => state.toggleTrace);
  const setShowRecurrenceModal = useLockinStore((state) => state.setShowRecurrenceModal);
  const boards = useLockinStore((state) => state.boards);
  const activeBoardId = useLockinStore((state) => state.activeBoardId);
  const createBoard = useLockinStore((state) => state.createBoard);
  const setActiveBoardId = useLockinStore((state) => state.setActiveBoardId);

  useEffect(() => {
    if (!input.startsWith("/")) {
      setDismissedSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [input, setDismissedSuggestions, setSelectedSuggestionIndex]);

  const commandSuggestions = getCommandSuggestions(mode, sessions, queue, idleSidetracks, session, selectedHistorySession, input);
  const filteredSuggestions = filterSuggestions(commandSuggestions, input);
  const showSuggestions = filteredSuggestions.length > 0 && input.startsWith("/") && !dismissedSuggestions;

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
      const workspaceEmpty = sessions.length === 0 && queue.length === 0 && idleSidetracks.length === 0;
      if (workspaceEmpty) {
        setToastMsg("Workspace is already empty — nothing to archive.");
      } else {
        if (args.trim()) {
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

    if (cmdName === "brainstorm") {
      let boardIdToUse = activeBoardId;
      if (args.trim()) {
        const boardName = args.trim();
        const existingBoard = boards.find(b => b.title.toLowerCase() === boardName.toLowerCase());
        if (existingBoard) {
          boardIdToUse = existingBoard.id;
          setActiveBoardId(existingBoard.id);
          setToastMsg(`Switching to board: ${existingBoard.title}`);
        } else {
          boardIdToUse = createBoard(boardName);
          setActiveBoardId(boardIdToUse);
          setToastMsg(`Created new board: ${boardName}`);
        }
      } else {
        setToastMsg("Opening Brainstorm Canvas...");
      }

      // Link board to context
      if (mode === "active" || mode === "panic") {
        if (session && boardIdToUse) {
           useLockinStore.setState({ session: { ...session, brainstormBoardId: boardIdToUse } });
        }
      } else if (mode === "idle") {
        if (boardIdToUse) {
          useLockinStore.getState().setLastIdleBoardId(boardIdToUse);
        }
      }
      
      setInput("");
      setTimeout(() => {
        navigate("/brainstorm");
      }, 300);
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

    if (cmdName === "star") {
      if (sessions.length === 0) {
        setToastMsg("No completed sessions in history to star.");
        setInput("");
        return;
      }
      if (!args) {
        if (selectedHistorySession) {
          const isCurrentlyStarred = selectedHistorySession.isStarred;
          toggleStarSession(selectedHistorySession.id || selectedHistorySession.startTime);
          setToastMsg(isCurrentlyStarred ? "Session unstarred." : "Session starred!");
        } else {
          const lastSession = sessions[sessions.length - 1];
          const isCurrentlyStarred = lastSession.isStarred;
          toggleStarSession(lastSession.id || lastSession.startTime);
          setToastMsg(isCurrentlyStarred ? "Last session unstarred." : "Last session starred!");
        }
      } else {
        const index = parseInt(args, 10);
        if (!isNaN(index) && index >= 1 && index <= sessions.length) {
          const targetSession = sessions[sessions.length - index];
          const isCurrentlyStarred = targetSession.isStarred;
          toggleStarSession(targetSession.id || targetSession.startTime);
          setToastMsg(isCurrentlyStarred ? `Unstarred: ${targetSession.task}` : `Starred: ${targetSession.task}`);
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
        useLockinStore.getState().deleteIdleSidetrack(index - 1);
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

    setInput("");
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
      const cmdName = trimmedInput.substring(1).split("\x1f")[0].toLowerCase();
      const schema = commandRegistry.find(s => s.name === cmdName || s.shortcuts?.includes(cmdName));
      if (schema) {
        if (schema.args.length === 0) {
          executeCommand(schema, [], "");
        } else {
          setInput("/" + schema.name + "\x1f");
        }
      } else {
        setInput("");
      }
      return;
    }

    const { schema, tokens, remainingInput, nextArg } = parsedResult;

    if (remainingInput.trim() !== "") {
      const isLastArg = tokens.length - 1 === schema.args.length - 1;
      if (isLastArg) {
        const finalTokens = [...tokens, { type: "arg", value: remainingInput.trim(), schema: nextArg, category: schema.category }];
        const args = finalTokens.slice(1).map(t => (t as any).value).join(" ");
        executeCommand(schema, finalTokens, args);
      } else {
        setInput(targetInput + "\x1f");
      }
    } else {
      const args = tokens.slice(1).map(t => t.value).join(" ");
      executeCommand(schema, tokens, args);
    }
  };

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
        const trimmedInput = input.trim();
        const parsedResult = getParsedCommand(input);
        if (!parsedResult) {
          const cmdName = trimmedInput.substring(1).split("\x1f")[0].toLowerCase();
          const schema = commandRegistry.find(s => s.name === cmdName || s.shortcuts?.includes(cmdName));
          if (schema) setInput("/" + schema.name + "\x1f");
        } else {
          if (parsedResult.remainingInput.trim() !== "") setInput(input + "\x1f");
        }
      } else if (mode === "idle" && queue.length > 0) {
        setInput(queue[0].text);
      }
    } else if (e.key === "Enter") {
      if (selectedHistorySession && input === "") {
        e.preventDefault();
        const idx = sessions.findIndex(s => (s.id || s.startTime) === (selectedHistorySession.id || selectedHistorySession.startTime));
        if (idx !== -1) setInput(`/continue ${sessions.length - idx}`);
      } else {
        handleEnterSubmit();
      }
    } else if (e.key === "Escape" && selectedHistorySession) {
      e.preventDefault();
      setSelectedHistorySession(null);
    }
  };

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
    placeholderText = queue.length > 0 ? "↵ to start · tab to fill queue item" : "what are you locking in on?";
    hintText = "type task name + ↵ to start  ·  /add <task> to queue  ·  tab to autofill queue";
  } else if (mode === "active") {
    placeholderText = "drop a note...";
    hintText = "type note + ↵ to log  ·  /done (or /d) to end  ·  /add <task> to queue";
  } else if (mode === "wrap") {
    const triageActive = triageSidetracks.length > 0 && activeTriageIndex < triageSidetracks.length;
    if (triageActive) {
      placeholderText = "[Q] queue  [S] start next  [D] delete  [↵] keep in inbox";
      hintText = `triaging sidetrack ${activeTriageIndex + 1} of ${triageSidetracks.length} — press a key`;
    } else {
      placeholderText = "type resume cue + ↵, or just ↵ to go idle";
      hintText = "leave a breadcrumb for your next session, then ↵";
    }
  }

  if (input.startsWith("/schedule")) hintText = "e.g., /schedule 5pm water plants --recur · formats: 5pm, 17:30, 5:30pm";
  else if (input.startsWith("/callback") || input.startsWith("/cb")) hintText = "e.g., /callback 5m call mom · chore starts after current session";

  const renderTimer = () => {
    if ((mode !== "active" && mode !== "panic") || !session) return null;
    const isPanic = mode === "panic";
    const isTimer = mode === "active" && session.timerEndElapsed !== undefined;
    
    return (
      <div className={`command-bar-timer ${isPanic || isTimer ? "urgent" : ""}`}>
        {isPanic || isTimer ? (
          <span style={{ color: "var(--color-panic)", fontWeight: "bold" }}>
            ⏳ {formatPanicTime((isPanic ? session.panicEndElapsed! : session.timerEndElapsed!) - elapsed)}
          </span>
        ) : (
          <span>{formatTime(elapsed)}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`command-bar-container ${compact ? "compact" : ""} ${className || ""}`}>
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
      <div className="command-bar-main" onClick={() => inputRef.current?.focus()}>
        {renderTimer()}
        <div className={`command-bar-input-wrapper ${setupStep !== "idle" ? "setup-active" : ""}`}>
          {(() => {
            const parsed = getParsedCommand(input);
            if (parsed && setupStep === "idle") {
              return (
                <>
                  {parsed.tokens.map((token, idx) => (
                    <div key={idx} className={`command-chip chip-${token.category || (token.schema ? "default" : "tasks")}`}>
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
      </div>
      {!compact && <div className="command-bar-hint">{hintText}</div>}
    </div>
  );
});
