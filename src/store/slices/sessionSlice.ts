import type { StateCreator } from "zustand";
import type { LockinStore } from "../useLockinStore";
import type { Session, SessionRevision, SessionTrend, Note, TodoItem, RecurrenceData } from "../../types";
import { playPopSound, playChimeSound, playMegaChimeSound } from "../../utils/audioSynth";
import { triggerConfetti } from "../../utils/confetti";
import { parseDuration } from "../../utils/commandParser";
import { sanitizeBrainstormBoard } from "./brainstormSlice";

function calculateNextRun(lastScheduled: number, recurrence: RecurrenceData): number {
  const date = new Date(lastScheduled);
  if (recurrence.type === "hourly") {
    date.setHours(date.getHours() + (recurrence.interval || 1));
  } else if (recurrence.type === "daily") {
    date.setDate(date.getDate() + (recurrence.interval || 1));
  } else if (recurrence.type === "weekly") {
    date.setDate(date.getDate() + 7 * (recurrence.interval || 1));
  } else if (recurrence.type === "custom_days" && recurrence.days && recurrence.days.length > 0) {
    const days = [...recurrence.days].sort((a, b) => a - b);
    const currentDay = date.getDay();
    let nextDay = days.find(d => d > currentDay);
    if (nextDay === undefined) {
      nextDay = days[0];
      date.setDate(date.getDate() + (7 - currentDay + nextDay));
    } else {
      date.setDate(date.getDate() + (nextDay - currentDay));
    }
  }
  return date.getTime();
}

export interface SessionSlice {
  session: Session | null;
  sessions: Session[];
  wrapData: Session | null;
  elapsed: number;
  inboxInput: string;
  setupTaskName: string | null;
  setupPanicLimit: number | null;
  setupStep: "idle" | "estimate" | "energy";
  setupEstimatedDuration: number | null;
  setupContinueSessionData: Session | null;

  tickElapsed: () => void;
  setElapsed: (elapsed: number) => void;
  rehydrateTimer: () => void;
  _checkDailyLimitReached: () => boolean;
  startSession: (taskName: string, estimatedDuration?: number, energyRating?: number) => void;
  startPanicSession: (taskName: string, duration: number, estimatedDuration?: number, energyRating?: number) => void;
  startNextQueuedTask: () => void;
  exitWrapMode: () => void;
  completeSession: (forcedEndTime?: number) => void;
  addNote: (text: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (index: number) => void;
  toggleTodoTimer: (index: number, duration?: number) => void;
  toggleTodoTimerByText: (text: string, duration?: number) => void;
  removeTodo: (index: number) => void;
  startSessionFromSidetrack: (index: number) => void;
  continueSession: (pastSession: Session, estimatedDuration?: number, energyRating?: number) => void;
  setInboxInput: (val: string) => void;
  setCloudData: (data: Partial<LockinStore>) => void;
  setResumeCueToLastSession: (cue: string) => void;
  setPanicTimer: (seconds: number, isExtension?: boolean) => void;
  cancelPanicTimer: () => void;
  setSessionTimer: (seconds: number, isExtension?: boolean) => void;
  initiateSessionSetup: (taskName: string, options?: { panicLimit?: number; continueSession?: Session }) => void;
  submitSetupEstimate: (estimateStr: string) => void;
  submitSetupEnergy: (energyStr: string) => void;
  cancelSessionSetup: () => void;
  checkCallbacks: () => void;
  associateBoardToSession: (boardId: string) => void;
}

export const createSessionSlice: StateCreator<LockinStore, [], [], SessionSlice> = (set, get) => ({
  session: null,
  sessions: [],
  wrapData: null,
  elapsed: 0,
  inboxInput: "",
  setupTaskName: null,
  setupPanicLimit: null,
  setupStep: "idle",
  setupEstimatedDuration: null,
  setupContinueSessionData: null,

  tickElapsed: () => {
    const { elapsed, completeSession, session, sessions } = get();
    const nextElapsed = elapsed + 1;
    const MAX_DAILY_SECONDS = 15 * 3600;
    
    if (nextElapsed > MAX_DAILY_SECONDS) {
      completeSession();
      return;
    }

    if (nextElapsed % 30 === 0 && session) {
      const now = Date.now();
      const startOfToday = new Date(now).setHours(0, 0, 0, 0);
      const completedToday = sessions
        .filter(s => s.endTime && s.endTime >= startOfToday)
        .reduce((acc, s) => {
          const effectiveStart = Math.max(s.startTime, startOfToday);
          return acc + Math.max(0, Math.round((s.endTime! - effectiveStart) / 1000));
        }, 0);

      const sessionStartToday = Math.max(session.startTime, startOfToday);
      const currentElapsedToday = Math.max(0, Math.round((now - sessionStartToday) / 1000));

      if (completedToday + currentElapsedToday >= MAX_DAILY_SECONDS) {
        completeSession();
        return;
      }
    }
    set({ elapsed: nextElapsed });
  },

  setElapsed: (elapsed) => set({ elapsed }),

  rehydrateTimer: () => {
    const { session, sessions, completeSession } = get();
    if (session) {
      const now = Date.now();
      const startOfToday = new Date(now).setHours(0, 0, 0, 0);
      const MAX_DAILY_SECONDS = 15 * 3600;

      const completedToday = sessions
        .filter(s => s.endTime && s.endTime >= startOfToday)
        .reduce((acc, s) => {
          const effectiveStart = Math.max(s.startTime, startOfToday);
          return acc + Math.max(0, Math.round((s.endTime! - effectiveStart) / 1000));
        }, 0);

      const diff = Math.max(0, Math.round((now - session.startTime) / 1000));
      const totalElapsed = diff + (session.accumulatedDuration || 0);
      const sessionStartToday = Math.max(session.startTime, startOfToday);
      const currentElapsedToday = Math.max(0, Math.round((now - sessionStartToday) / 1000));

      if (completedToday + currentElapsedToday >= MAX_DAILY_SECONDS) {
        const allowanceToday = MAX_DAILY_SECONDS - completedToday;
        const forcedEndTime = sessionStartToday + Math.max(0, allowanceToday) * 1000;
        const finalElapsed = Math.round((forcedEndTime - session.startTime) / 1000) + (session.accumulatedDuration || 0);
        set({ elapsed: finalElapsed });
        completeSession(forcedEndTime);
      } else {
        set({ elapsed: totalElapsed });
      }
    }
  },

  _checkDailyLimitReached: () => {
    const { sessions } = get();
    const now = Date.now();
    const startOfToday = new Date(now).setHours(0, 0, 0, 0);
    const MAX_DAILY_SECONDS = 15 * 3600;
    const completedToday = sessions
      .filter(s => s.endTime && s.endTime >= startOfToday)
      .reduce((acc, s) => {
        const effectiveStart = Math.max(s.startTime, startOfToday);
        return acc + Math.max(0, Math.round((s.endTime! - effectiveStart) / 1000));
      }, 0);
    return completedToday >= MAX_DAILY_SECONDS;
  },

  startSession: (taskName, estimatedDuration, energyRating) => {
    if (get()._checkDailyLimitReached()) {
      set({ toastMsg: "Daily focus limit (15h) reached. Rest up!" });
      return;
    }
    const time = Date.now();
    set({
      session: {
        id: time,
        task: taskName,
        startTime: time,
        notes: [],
        revision: 1,
        estimatedDuration,
        energyRating
      },
      elapsed: 0,
      mode: "active",
      wrapData: null,
      input: "",
      triageSidetracks: [],
      activeTriageIndex: 0,
      showPanicModal: false,
      activeArchiveId: null,
      activeArchiveLabel: null,
      setupStep: "idle",
      setupTaskName: null,
      setupPanicLimit: null,
      setupEstimatedDuration: null,
      setupContinueSessionData: null,
    });
  },

  startPanicSession: (taskName, duration, estimatedDuration, energyRating) => {
    if (get()._checkDailyLimitReached()) {
      set({ toastMsg: "Daily focus limit (15h) reached. Rest up!" });
      return;
    }
    const time = Date.now();
    set({
      session: {
        id: time,
        task: taskName,
        startTime: time,
        notes: [],
        revision: 1,
        panicLimit: duration,
        panicEndElapsed: duration,
        estimatedDuration: estimatedDuration ?? duration,
        energyRating
      },
      elapsed: 0,
      mode: "panic",
      wrapData: null,
      input: "",
      triageSidetracks: [],
      activeTriageIndex: 0,
      showPanicModal: true,
      activeArchiveId: null,
      activeArchiveLabel: null,
      setupStep: "idle",
      setupTaskName: null,
      setupPanicLimit: null,
      setupEstimatedDuration: null,
      setupContinueSessionData: null,
    });
  },

  startNextQueuedTask: () => {
    const { queue } = get();
    if (queue.length > 0) {
      if (get()._checkDailyLimitReached()) {
        set({ toastMsg: "Daily focus limit (15h) reached. Rest up!" });
        return;
      }
      const nextTask = queue[0];
      const time = Date.now();
      set({
        queue: queue.slice(1),
        session: { id: time, task: nextTask.text, startTime: time, notes: [], revision: 1 },
        elapsed: 0,
        mode: "active",
        wrapData: null,
        triageSidetracks: [],
        activeTriageIndex: 0,
        showPanicModal: false,
        activeArchiveId: null,
        activeArchiveLabel: null,
      });
    }
  },

  exitWrapMode: () => {
    set({ mode: "idle", wrapData: null, triageSidetracks: [], activeTriageIndex: 0, input: "" });
    get().checkCallbacks();
  },

  completeSession: (forcedEndTime) => {
    const { session, soundEnabled } = get();
    if (session) {
      const endTime = forcedEndTime || Date.now();
      const runDuration = Math.round((endTime - session.startTime) / 1000);
      const totalDuration = runDuration + (session.accumulatedDuration || 0);

      const currentRevision: SessionRevision = {
        revisionNumber: session.revision || 1,
        startTime: session.startTime,
        endTime,
        duration: runDuration,
        notes: [...session.notes],
        todos: [...(session.todos || [])],
        sidetracks: [...(session.sidetracks || [])],
        estimatedDuration: session.estimatedDuration,
        energyRating: session.energyRating,
      };

      const updatedHistory = [...(session.revisionHistory || []), currentRevision];
      const completedSession: Session = {
        ...session,
        endTime,
        duration: totalDuration,
        revisionHistory: updatedHistory,
      };
      const sessionId = session.id || session.startTime;
      const sessionSidetracks = session.sidetracks || [];

      const trend: SessionTrend = {
        sessionId: String(sessionId),
        task: session.task,
        energyRating: session.energyRating ?? null,
        estimatedDuration: session.estimatedDuration ?? null,
        actualDuration: totalDuration,
        startTime: session.startTime,
        endTime,
        revisionCount: updatedHistory.length,
      };

      const isMega = Math.random() < 1 / 6;
      if (soundEnabled) {
        try {
          if (isMega) playMegaChimeSound();
          else playChimeSound();
        } catch (e) { console.warn("Chime sound play failed", e); }
      }
      try { triggerConfetti(isMega); } catch (e) { console.warn("Confetti trigger failed", e); }

      set((state) => {
        const exists = state.sessions.some((s) => (s.id || s.startTime) === sessionId);
        const updatedSessions = exists
          ? state.sessions.map((s) => (s.id || s.startTime) === sessionId ? completedSession : s)
          : [...state.sessions, completedSession];
        return {
          sessions: updatedSessions,
          wrapData: completedSession,
          session: null,
          mode: "wrap",
          input: "",
          zenMode: false,
          triageSidetracks: sessionSidetracks,
          activeTriageIndex: 0,
          pendingTrend: trend,
        };
      });
    }
  },

  addNote: (text) => {
    const { session } = get();
    if (session) {
      const newNote: Note = { text, ts: Date.now() };
      set({ session: { ...session, notes: [...session.notes, newNote] } });
    }
  },

  addTodo: (text) => {
    const { session } = get();
    if (session) {
      const newTodo: TodoItem = { id: Date.now(), text, completed: false };
      set({ session: { ...session, todos: [...(session.todos || []), newTodo] } });
    }
  },

  toggleTodo: (index) => {
    const { session, soundEnabled, elapsed } = get();
    if (session && session.todos && session.todos.length > 0) {
      let todoIdx = index;
      if (todoIdx === -1) {
        todoIdx = session.todos.findIndex((t) => !t.completed);
      }
      if (todoIdx !== -1 && todoIdx >= 0 && todoIdx < session.todos.length) {
        const wasCompleted = session.todos[todoIdx].completed;
        const updated = session.todos.map((todo, idx) => {
          if (idx === todoIdx) {
            const isMarkingComplete = !todo.completed;
            let updatedTodo = { ...todo, completed: isMarkingComplete };
            if (isMarkingComplete && todo.isTimerRunning) {
              const addedDuration = elapsed - (todo.timerStartElapsed || elapsed);
              updatedTodo = {
                ...updatedTodo,
                isTimerRunning: false,
                timerDuration: (todo.timerDuration || 0) + addedDuration,
                timerStartElapsed: undefined,
                timerTargetElapsed: undefined
              };
            }
            return updatedTodo;
          }
          return todo;
        });

        set({ session: { ...session, todos: updated } });
        if (!wasCompleted && soundEnabled) {
          try { playPopSound(); } catch (e) { console.warn("Pop sound play failed", e); }
        }
      }
    }
  },

  toggleTodoTimer: (index, duration) => {
    const { session, elapsed } = get();
    if (session && session.todos && index >= 0 && index < session.todos.length) {
      const updated = session.todos.map((todo, idx) => {
        if (idx === index) {
          const isStarting = !todo.isTimerRunning;
          if (isStarting) {
            return { 
              ...todo, 
              isTimerRunning: true, 
              timerStartElapsed: elapsed,
              timerTargetElapsed: duration ? elapsed + duration : undefined
            };
          } else {
            const addedDuration = elapsed - (todo.timerStartElapsed || elapsed);
            return {
              ...todo,
              isTimerRunning: false,
              timerDuration: (todo.timerDuration || 0) + addedDuration,
              timerStartElapsed: undefined,
              timerTargetElapsed: undefined
            };
          }
        }
        if (todo.isTimerRunning) {
          const addedDuration = elapsed - (todo.timerStartElapsed || elapsed);
          return {
            ...todo,
            isTimerRunning: false,
            timerDuration: (todo.timerDuration || 0) + addedDuration,
            timerStartElapsed: undefined,
            timerTargetElapsed: undefined
          };
        }
        return todo;
      });
      set({ session: { ...session, todos: updated } });
    }
  },

  toggleTodoTimerByText: (text, duration) => {
    const { session, toggleTodoTimer } = get();
    if (session && session.todos) {
      const idx = session.todos.findIndex(t => t.text.toLowerCase() === text.toLowerCase());
      if (idx !== -1) {
        toggleTodoTimer(idx, duration);
      }
    }
  },

  removeTodo: (index) => {
    const { session } = get();
    if (session && session.todos && index >= 0 && index < session.todos.length) {
      const updated = session.todos.filter((_, idx) => idx !== index);
      set({ session: { ...session, todos: updated } });
    }
  },

  startSessionFromSidetrack: (index) => {
    const { idleSidetracks, initiateSessionSetup } = get();
    if (index >= 0 && index < idleSidetracks.length) {
      const taskName = idleSidetracks[index];
      const updatedSidetracks = idleSidetracks.filter((_, idx) => idx !== index);
      set({ idleSidetracks: updatedSidetracks });
      initiateSessionSetup(taskName);
    }
  },

  continueSession: (pastSession, estimatedDuration, energyRating) => {
    if (get()._checkDailyLimitReached()) {
      set({ toastMsg: "Daily focus limit (15h) reached. Rest up!" });
      return;
    }
    const sessionId = pastSession.id || pastSession.startTime;
    const revision = (pastSession.revision || 1) + 1;
    const accumulatedDuration = pastSession.duration || 0;
    set({
      session: {
        ...pastSession,
        id: sessionId,
        startTime: Date.now(),
        accumulatedDuration,
        revision,
        duration: undefined,
        endTime: undefined,
        notes: [],
        sidetracks: [],
        panicLimit: 300,
        panicEndElapsed: accumulatedDuration + 300,
        estimatedDuration,
        energyRating
      },
      elapsed: accumulatedDuration,
      mode: "active",
      wrapData: null,
      input: "",
      selectedHistorySession: null,
      triageSidetracks: [],
      activeTriageIndex: 0,
      showPanicModal: true,
      activeArchiveId: null,
      activeArchiveLabel: null,
    });
  },

  setInboxInput: (inboxInput) => set({ inboxInput }),
  
  setCloudData: (data) => set((state) => ({ 
    ...state, 
    ...data,
    boards: data.boards ? data.boards.map(sanitizeBrainstormBoard) : state.boards
  })),

  setResumeCueToLastSession: (cue) => set((state) => {
    if (state.sessions.length > 0) {
      const updated = [...state.sessions];
      const lastSession = updated[updated.length - 1];
      updated[updated.length - 1] = { ...lastSession, resumeCue: cue };
      return {
        sessions: updated,
        wrapData: state.wrapData ? { ...state.wrapData, resumeCue: cue } : null,
      };
    }
    return {};
  }),

  setPanicTimer: (seconds, isExtension = false) => set((state) => {
    if (state.session) {
      const currentLimit = state.session.panicLimit || 0;
      const currentEnd = state.session.panicEndElapsed || state.elapsed;
      const newLimit = isExtension ? currentLimit + seconds : seconds;
      const newEnd = isExtension ? currentEnd + seconds : state.elapsed + seconds;
      return { session: { ...state.session, panicLimit: newLimit, panicEndElapsed: newEnd } };
    }
    return {};
  }),

  cancelPanicTimer: () => set((state) => {
    if (state.session) {
      return { session: { ...state.session, panicLimit: undefined, panicEndElapsed: undefined } };
    }
    return {};
  }),

  setSessionTimer: (seconds, isExtension = false) => set((state) => {
    if (state.session) {
      const currentEnd = state.session.timerEndElapsed || state.elapsed;
      const newEnd = isExtension ? currentEnd + seconds : state.elapsed + seconds;
      return { session: { ...state.session, timerEndElapsed: newEnd } };
    }
    return {};
  }),

  initiateSessionSetup: (taskName, options) => {
    if (options?.panicLimit) {
      get().startPanicSession(taskName, options.panicLimit, options.panicLimit, 3);
      return;
    }
    set({
      setupTaskName: taskName,
      setupPanicLimit: options?.panicLimit ?? null,
      setupContinueSessionData: options?.continueSession ?? null,
      setupStep: "estimate",
      setupEstimatedDuration: null,
      input: "",
    });
  },

  submitSetupEstimate: (estimateStr) => {
    const trimmed = estimateStr.trim();
    if (trimmed === "") {
      set({ setupEstimatedDuration: null, setupStep: "energy", input: "" });
      return;
    }
    const seconds = parseDuration(trimmed);
    if (seconds === null || seconds <= 0) {
      set({ toastMsg: "Invalid format. E.g., '25m', '10m', '1h', or Enter to skip." });
      return;
    }
    set({ setupEstimatedDuration: seconds, setupStep: "energy", input: "" });
  },

  submitSetupEnergy: (energyStr) => {
    const trimmed = energyStr.trim();
    let energyRating = 3;
    if (trimmed !== "") {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val) && val >= 1 && val <= 5) energyRating = val;
      else {
        set({ toastMsg: "Please enter a rating between 1 and 5, or Enter to skip." });
        return;
      }
    }
    const { setupTaskName, setupPanicLimit, setupEstimatedDuration, setupContinueSessionData, startSession, startPanicSession, continueSession } = get();
    if (setupContinueSessionData) {
      continueSession(setupContinueSessionData, setupEstimatedDuration ?? undefined, energyRating);
    } else if (setupPanicLimit !== null) {
      startPanicSession(setupTaskName || "Unnamed Panic Task", setupPanicLimit, setupEstimatedDuration ?? undefined, energyRating);
    } else {
      startSession(setupTaskName || "Unnamed Task", setupEstimatedDuration ?? undefined, energyRating);
    }
    set({
      setupTaskName: null,
      setupPanicLimit: null,
      setupContinueSessionData: null,
      setupStep: "idle",
      setupEstimatedDuration: null,
      input: "",
    });
  },

  cancelSessionSetup: () => {
    set({
      setupTaskName: null,
      setupPanicLimit: null,
      setupContinueSessionData: null,
      setupStep: "idle",
      setupEstimatedDuration: null,
      input: "",
      toastMsg: "Session setup cancelled.",
    });
    get().checkCallbacks();
  },

  checkCallbacks: () => {
    const { mode, callbacks, schedules, setupStep, startPanicSession } = get();
    if (mode !== "idle" || setupStep !== "idle") return;

    if (callbacks.length > 0) {
      const callback = callbacks[0];
      const newCallbacks = callbacks.slice(1);
      set({ callbacks: newCallbacks });
      startPanicSession(callback.task, callback.duration, callback.duration, 3);
      set({ toastMsg: `Callback chore: ${callback.task}` });
      return;
    }

    const now = Date.now();
    const dueScheduledIdx = schedules.findIndex(s => s.scheduledTime && s.scheduledTime <= now);
    if (dueScheduledIdx !== -1) {
      const schedule = schedules[dueScheduledIdx];
      const newSchedules = [...schedules];
      if (schedule.recurrence) {
        const nextTime = calculateNextRun(schedule.scheduledTime!, schedule.recurrence);
        newSchedules[dueScheduledIdx] = { ...schedule, scheduledTime: nextTime };
      } else {
        newSchedules.splice(dueScheduledIdx, 1);
      }
      set({ schedules: newSchedules });
      startPanicSession(schedule.task, schedule.duration, schedule.duration, 3);
      set({ toastMsg: `Forced chore: ${schedule.task}` });
    }
  },

  associateBoardToSession: (boardId) => {
    const { session } = get();
    if (session) {
      set({ session: { ...session, brainstormBoardId: boardId } });
    }
  },
});
