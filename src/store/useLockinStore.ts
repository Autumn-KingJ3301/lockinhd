import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, TodoItem, Session, SessionRevision, QueueItem, AppMode, Theme, Archive, StashData, SessionTrend, CallbackTask, RecurrenceData } from "../types";
import { playPopSound, playChimeSound, playMegaChimeSound } from "../utils/audioSynth";
import { triggerConfetti } from "../utils/confetti";
import { parseDuration } from "../utils/commandParser";

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

export interface LockinStoreState {
  mode: AppMode;
  input: string;
  queue: QueueItem[];
  session: Session | null;
  sessions: Session[];
  wrapData: Session | null;
  elapsed: number;
  dismissedSuggestions: boolean;
  selectedSuggestionIndex: number;
  toastMsg: string | null;
  idleSidetracks: string[];
  showHistoryPanel: boolean;
  showInboxPanel: boolean;
  selectedHistorySession: Session | null;
  inboxInput: string;
  theme: Theme;
  isSystemDark: boolean;
  zenMode: boolean;
  soundEnabled: boolean;
  triageSidetracks: string[];
  activeTriageIndex: number;
  showHelp: boolean;
  selectedRevisionIndex: number | null;
  showPanicModal: boolean;
  showTasksPanel: boolean;
  showCallbacksPanel: boolean;
  showSchedulesPanel: boolean;
  setupTaskName: string | null;
  setupPanicLimit: number | null;
  setupStep: "idle" | "estimate" | "energy";
  setupEstimatedDuration: number | null;
  setupContinueSessionData: Session | null;
  // Archive & stash
  archives: Archive[];
  stash: StashData | null;
  archivesLoading: boolean;
  showArchivesPanel: boolean;
  archiveConfirmPending: boolean;
  // Pending trend: cleared after cloud sync writes it
  pendingTrend: SessionTrend | null;
  activeArchiveId: string | null;
  activeArchiveLabel: string | null;
  callbacks: CallbackTask[];
  schedules: CallbackTask[];
  callbacksInput: string;
  schedulesInput: string;
  showRecurrenceModal: boolean;
  recurrenceModalTaskId: number | null;
}

export interface LockinStoreActions {
  // Mode & Timer
  setMode: (mode: AppMode) => void;
  setInput: (input: string) => void;
  tickElapsed: () => void;
  setElapsed: (elapsed: number) => void;
  rehydrateTimer: () => void;

  // Theme & Panel Toggles
  setTheme: (theme: Theme) => void;
  setIsSystemDark: (val: boolean) => void;
  setShowHistoryPanel: (val: boolean) => void;
  setShowInboxPanel: (val: boolean) => void;
  setSelectedHistorySession: (session: Session | null) => void;

  // Queued Tasks
  addToQueue: (taskText: string) => void;
  deleteQueueItem: (id: number) => void;
  startSession: (taskName: string, estimatedDuration?: number, energyRating?: number) => void;
  startPanicSession: (taskName: string, duration: number, estimatedDuration?: number, energyRating?: number) => void;
  startNextQueuedTask: () => void;
  exitWrapMode: () => void;

  // Session Management
  completeSession: () => void;
  addNote: (text: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (index: number) => void;
  toggleTodoTimer: (index: number, duration?: number) => void;
  toggleTodoTimerByText: (text: string, duration?: number) => void;
  removeTodo: (index: number) => void;

  // Sidetracks
  addSidetrack: (text: string) => void;
  deleteIdleSidetrack: (index: number) => void;
  addIdleSidetrackDirect: () => void; // from quick capture input
  startSessionFromSidetrack: (index: number) => void;
  continueSession: (pastSession: Session, estimatedDuration?: number, energyRating?: number) => void;

  // Suggestions & Toasts
  setDismissedSuggestions: (val: boolean) => void;
  setSelectedSuggestionIndex: (idx: number) => void;
  setToastMsg: (msg: string | null) => void;
  setInboxInput: (val: string) => void;

  // ADHD Focus Enhancements
  setZenMode: (val: boolean) => void;
  toggleZenMode: () => void;
  setSoundEnabled: (val: boolean) => void;
  setResumeCueToLastSession: (cue: string) => void;
  processCurrentTriage: (action: "queue" | "start" | "delete" | "keep") => void;
  setShowHelp: (val: boolean) => void;
  toggleHelp: () => void;
  setCloudData: (data: Partial<LockinStoreState>) => void;
  setSelectedRevisionIndex: (idx: number | null) => void;
  setPanicTimer: (seconds: number, isExtension?: boolean) => void;
  cancelPanicTimer: () => void;
  setShowPanicModal: (val: boolean) => void;
  setShowTasksPanel: (val: boolean) => void;
  setShowCallbacksPanel: (val: boolean) => void;
  toggleCallbacksPanel: () => void;
  setShowSchedulesPanel: (val: boolean) => void;
  toggleSchedulesPanel: () => void;
  setSessionTimer: (seconds: number, isExtension?: boolean) => void;
  initiateSessionSetup: (taskName: string, options?: { panicLimit?: number; continueSession?: Session }) => void;
  submitSetupEstimate: (estimateStr: string) => void;
  submitSetupEnergy: (energyStr: string) => void;
  cancelSessionSetup: () => void;
  addCallback: (task: string, duration: number) => void;
  deleteCallback: (id: number) => void;
  deleteCallbackByIndex: (index: number) => void;
  addSchedule: (task: string, duration: number, scheduledTime: number, id?: number) => void;
  deleteSchedule: (id: number) => void;
  deleteScheduleByIndex: (index: number) => void;
  checkCallbacks: () => void;
  setCallbacksInput: (val: string) => void;
  setSchedulesInput: (val: string) => void;
  addCallbackDirect: () => void;
  addScheduleDirect: () => void;
  setShowRecurrenceModal: (val: boolean) => void;
  setRecurrence: (taskId: number, recurrence: RecurrenceData | undefined) => void;
  // Archive & stash actions
  createArchive: (label?: string) => Archive;
  setArchives: (archives: Archive[]) => void;
  setArchivesLoading: (val: boolean) => void;
  restoreArchive: (archiveId: string) => { stashCreated: boolean };
  popStash: () => void;
  discardStash: () => void;
  setStash: (stash: StashData | null) => void;
  clearPendingTrend: () => void;
  setShowArchivesPanel: (val: boolean) => void;
  toggleArchivesPanel: () => void;
  setArchiveConfirmPending: (val: boolean) => void;
  closeArchive: () => void;
}

export type LockinStore = LockinStoreState & LockinStoreActions;

export const useLockinStore = create<LockinStore>()(
  persist(
    (set, get) => ({
      // State Defaults
      mode: "idle",
      input: "",
      queue: [],
      session: null,
      sessions: [],
      wrapData: null,
      elapsed: 0,
      dismissedSuggestions: false,
      selectedSuggestionIndex: -1,
      toastMsg: null,
      idleSidetracks: [],
      showHistoryPanel: true,
      showInboxPanel: true,
      selectedHistorySession: null,
      inboxInput: "",
      theme: "system",
      isSystemDark: false,
      callbacks: [],
      zenMode: false,
      soundEnabled: true,
      triageSidetracks: [],
      activeTriageIndex: 0,
      showHelp: false,
      selectedRevisionIndex: null,
      showPanicModal: true,
      showTasksPanel: true,
      showCallbacksPanel: false,
      showSchedulesPanel: false,
      setupTaskName: null,
      setupPanicLimit: null,
      setupStep: "idle",
      setupEstimatedDuration: null,
      setupContinueSessionData: null,
      // Archive & stash defaults
      archives: [],
      stash: null,
      archivesLoading: false,
      showArchivesPanel: false,
      archiveConfirmPending: false,
      pendingTrend: null,
      activeArchiveId: null,
      activeArchiveLabel: null,
      schedules: [],
      callbacksInput: "",
      schedulesInput: "",
      showRecurrenceModal: false,
      recurrenceModalTaskId: null,
      // Actions
      setMode: (mode) => set({ mode }),
      setInput: (input) => set({ input }),
      tickElapsed: () => set((state) => ({ elapsed: state.elapsed + 1 })),
      setElapsed: (elapsed) => set({ elapsed }),
      rehydrateTimer: () => {
        const { session } = get();
        if (session) {
          const diff = Math.max(0, Math.round((Date.now() - session.startTime) / 1000)) + (session.accumulatedDuration || 0);
          set({ elapsed: diff });
        }
      },

      setTheme: (theme) => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
          localStorage.removeItem("lockin-theme");
        } else {
          root.classList.add(theme);
          localStorage.setItem("lockin-theme", theme);
        }
        set({ theme });
      },
      setIsSystemDark: (isSystemDark) => set({ isSystemDark }),
      setShowHistoryPanel: (showHistoryPanel) => set({ showHistoryPanel }),
      setShowInboxPanel: (showInboxPanel) => set({ showInboxPanel }),
      setSelectedHistorySession: (selectedHistorySession) => set({ selectedHistorySession }),

      addToQueue: (taskText) =>
        set((state) => ({
          queue: [...state.queue, { id: Date.now(), text: taskText }],
        })),
      deleteQueueItem: (id) =>
        set((state) => ({
          queue: state.queue.filter((q) => q.id !== id),
        })),
      startSession: (taskName, estimatedDuration, energyRating) => {
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
      },      startNextQueuedTask: () => {
        const { queue } = get();
        if (queue.length > 0) {
          const nextTask = queue[0];
          const time = Date.now();
          set({
            queue: queue.slice(1),
            session: { 
              id: time, 
              task: nextTask.text, 
              startTime: time, 
              notes: [], 
              revision: 1
            },
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

      completeSession: () => {
        const { session, soundEnabled } = get();
        if (session) {
          const endTime = Date.now();
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

          // Build a SessionTrend document for analytics
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
              if (isMega) {
                playMegaChimeSound();
              } else {
                playChimeSound();
              }
            } catch (e) { console.warn("Chime sound play failed", e); }
          }
          try { triggerConfetti(isMega); } catch (e) { console.warn("Confetti trigger failed", e); }

          set((state) => {
            const exists = state.sessions.some((s) => (s.id || s.startTime) === sessionId);
            const updatedSessions = exists
              ? state.sessions.map((s) =>
                  (s.id || s.startTime) === sessionId ? completedSession : s
                )
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
          set({
            session: { ...session, notes: [...session.notes, newNote] },
          });
        }
      },
      addTodo: (text) => {
        const { session } = get();
        if (session) {
          const newTodo: TodoItem = { id: Date.now(), text, completed: false };
          set({
            session: { ...session, todos: [...(session.todos || []), newTodo] },
          });
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
                
                // If marking complete and timer is running, stop it
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
            // Play pop sound when marking as complete (not when unchecking)
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
            // Pause other todo timers when a new one starts
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

      addSidetrack: (text) => {
        const { mode, session } = get();
        if (mode === "active" && session) {
          const updated = [...(session.sidetracks || []), text];
          set({ session: { ...session, sidetracks: updated } });
        } else {
          set((state) => ({ idleSidetracks: [...state.idleSidetracks, text] }));
        }
      },
      deleteIdleSidetrack: (index) =>
        set((state) => ({
          idleSidetracks: state.idleSidetracks.filter((_, idx) => idx !== index),
        })),
      addIdleSidetrackDirect: () => {
        const { inboxInput } = get();
        if (inboxInput.trim()) {
          set((state) => ({
            idleSidetracks: [...state.idleSidetracks, inboxInput.trim()],
            inboxInput: "",
          }));
        }
      },
      startSessionFromSidetrack: (index) => {
        const { idleSidetracks, initiateSessionSetup } = get();
        if (index >= 0 && index < idleSidetracks.length) {
          const taskName = idleSidetracks[index];
          const updatedSidetracks = idleSidetracks.filter((_, idx) => idx !== index);
          set({
            idleSidetracks: updatedSidetracks,
          });
          initiateSessionSetup(taskName);
        }
      },
      continueSession: (pastSession, estimatedDuration, energyRating) => {
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
            notes: [], // Reset for new revision
            sidetracks: [], // Reset for new revision
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

      setDismissedSuggestions: (dismissedSuggestions) => set({ dismissedSuggestions }),
      setSelectedSuggestionIndex: (selectedSuggestionIndex) => set({ selectedSuggestionIndex }),
      setToastMsg: (toastMsg) => set({ toastMsg }),
      setInboxInput: (inboxInput) => set({ inboxInput }),

      // ADHD Focus Enhancements Actions
      setZenMode: (zenMode) => set({ zenMode }),
      toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
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
      processCurrentTriage: (action) => set((state) => {
        const { triageSidetracks, activeTriageIndex, queue, idleSidetracks } = state;
        if (activeTriageIndex >= triageSidetracks.length) return {};

        const trackText = triageSidetracks[activeTriageIndex];
        const updatedQueue = [...queue];
        const updatedIdleSidetracks = [...idleSidetracks];

        if (action === "queue") {
          updatedQueue.push({ id: Date.now(), text: trackText });
        } else if (action === "start") {
          updatedQueue.unshift({ id: Date.now(), text: trackText });
        } else if (action === "keep") {
          updatedIdleSidetracks.push(trackText);
        }
        // "delete" does nothing (drops it)

        return {
          queue: updatedQueue,
          idleSidetracks: updatedIdleSidetracks,
          activeTriageIndex: activeTriageIndex + 1,
        };
      }),
      setShowHelp: (showHelp) => set({ showHelp }),
      toggleHelp: () => set((state) => {
        return { showHelp: !state.showHelp };
      }),
      setCloudData: (data) => set((state) => ({ ...state, ...data })),
      setSelectedRevisionIndex: (idx) => set({ selectedRevisionIndex: idx }),

      // ─── Archive & Stash Actions ────────────────────────────────────────────
      setArchives: (archives) => set({ archives }),
      setArchivesLoading: (val) => set({ archivesLoading: val }),
      setStash: (stash) => set({ stash }),
      clearPendingTrend: () => set({ pendingTrend: null }),
      setShowArchivesPanel: (val) => set({ showArchivesPanel: val }),
      toggleArchivesPanel: () => set((state) => ({ showArchivesPanel: !state.showArchivesPanel })),
      setArchiveConfirmPending: (val) => set({ archiveConfirmPending: val }),

      createArchive: (label) => {
        const state = get();
        const now = Date.now();
        const dateLabel = label || new Date(now).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        });
        const archive: Archive = {
          id: String(now),
          createdAt: now,
          label: dateLabel,
          sessions: [...state.sessions],
          queue: [...state.queue],
          idleSidetracks: [...state.idleSidetracks],
          wrapData: state.wrapData,
        };
        // Clear workspace, reset to idle, prepend to archive list
        set({
          sessions: [],
          queue: [],
          idleSidetracks: [],
          wrapData: null,
          mode: "idle",
          session: null,
          triageSidetracks: [],
          activeTriageIndex: 0,
          archives: [archive, ...state.archives],
          activeArchiveId: null,
          activeArchiveLabel: null,
        });
        return archive;
      },

      restoreArchive: (archiveId) => {
        const state = get();
        const archive = state.archives.find((a) => a.id === archiveId);
        if (!archive) return { stashCreated: false };

        // If workspace has content, push to stash before restoring
        const hasContent =
          state.sessions.length > 0 ||
          state.queue.length > 0 ||
          state.idleSidetracks.length > 0;

        const newStash: StashData | null = hasContent
          ? {
              sessions: [...state.sessions],
              queue: [...state.queue],
              idleSidetracks: [...state.idleSidetracks],
              wrapData: state.wrapData,
              stashedAt: Date.now(),
            }
          : null;

        set({
          sessions: archive.sessions,
          queue: archive.queue,
          idleSidetracks: archive.idleSidetracks,
          wrapData: archive.wrapData,
          stash: newStash,
          mode: "idle",
          session: null,
          triageSidetracks: [],
          activeTriageIndex: 0,
          activeArchiveId: archive.id,
          activeArchiveLabel: archive.label,
        });
        return { stashCreated: hasContent };
      },

      popStash: () => {
        const { stash } = get();
        if (!stash) return;
        set({
          sessions: stash.sessions,
          queue: stash.queue,
          idleSidetracks: stash.idleSidetracks,
          wrapData: stash.wrapData,
          stash: null,
          mode: "idle",
          session: null,
          activeArchiveId: null,
          activeArchiveLabel: null,
        });
      },

      discardStash: () => set({ stash: null }),
      closeArchive: () => {
        const { stash } = get();
        if (stash) {
          set({
            sessions: stash.sessions,
            queue: stash.queue,
            idleSidetracks: stash.idleSidetracks,
            wrapData: stash.wrapData,
            stash: null,
            mode: "idle",
            session: null,
            activeArchiveId: null,
            activeArchiveLabel: null,
          });
        } else {
          set({
            sessions: [],
            queue: [],
            idleSidetracks: [],
            wrapData: null,
            mode: "idle",
            session: null,
            activeArchiveId: null,
            activeArchiveLabel: null,
          });
        }
      },
      setPanicTimer: (seconds, isExtension = false) => set((state) => {
        if (state.session) {
          const currentLimit = state.session.panicLimit || 0;
          const currentEnd = state.session.panicEndElapsed || state.elapsed;
          const newLimit = isExtension ? currentLimit + seconds : seconds;
          const newEnd = isExtension ? currentEnd + seconds : state.elapsed + seconds;
          return {
            session: {
              ...state.session,
              panicLimit: newLimit,
              panicEndElapsed: newEnd
            }
          };
        }
        return {};
      }),
      cancelPanicTimer: () => set((state) => {
        if (state.session) {
          return {
            session: {
              ...state.session,
              panicLimit: undefined,
              panicEndElapsed: undefined
            }
          };
        }
        return {};
      }),
      setShowPanicModal: (showPanicModal) => set({ showPanicModal }),
      setShowTasksPanel: (showTasksPanel) => set({ showTasksPanel }),
      setShowCallbacksPanel: (showCallbacksPanel) => set({ showCallbacksPanel }),
      toggleCallbacksPanel: () => set((state) => ({ showCallbacksPanel: !state.showCallbacksPanel })),
      setShowSchedulesPanel: (showSchedulesPanel) => set({ showSchedulesPanel }),
      toggleSchedulesPanel: () => set((state) => ({ showSchedulesPanel: !state.showSchedulesPanel })),
      setSessionTimer: (seconds, isExtension = false) => set((state) => {
        if (state.session) {
          const currentEnd = state.session.timerEndElapsed || state.elapsed;
          const newEnd = isExtension ? currentEnd + seconds : state.elapsed + seconds;
          return {
            session: {
              ...state.session,
              timerEndElapsed: newEnd
            }
          };
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
          set({
            setupEstimatedDuration: null,
            setupStep: "energy",
            input: "",
          });
          return;
        }

        const seconds = parseDuration(trimmed);
        if (seconds === null || seconds <= 0) {
          set({ toastMsg: "Invalid format. E.g., '25m', '10m', '1h', or Enter to skip." });
          return;
        }

        set({
          setupEstimatedDuration: seconds,
          setupStep: "energy",
          input: "",
        });
      },
      submitSetupEnergy: (energyStr) => {
        const trimmed = energyStr.trim();
        let energyRating = 3;

        if (trimmed !== "") {
          const val = parseInt(trimmed, 10);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            energyRating = val;
          } else {
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
        // When setup is cancelled, we might want to check if there are other pending callbacks
        get().checkCallbacks();
      },
      addCallback: (task, duration) => {
        const newCallback: CallbackTask = {
          id: Date.now(),
          task,
          duration,
        };
        set(state => ({ callbacks: [...state.callbacks, newCallback] }));
        set({ toastMsg: `Callback added: "${task}" will run after current session.` });
      },
      deleteCallback: (id) => set((state) => ({
        callbacks: state.callbacks.filter(c => c.id !== id)
      })),
      deleteCallbackByIndex: (index) => set((state) => {
        const newCallbacks = [...state.callbacks];
        if (index >= 0 && index < newCallbacks.length) {
          newCallbacks.splice(index, 1);
          return { callbacks: newCallbacks };
        }
        return {};
      }),
      addSchedule: (task, duration, scheduledTime, id) => {
        const newSchedule: CallbackTask = {
          id: id || Date.now(),
          task,
          duration,
          scheduledTime
        };
        set(state => ({ schedules: [...state.schedules, newSchedule] }));
        const timeStr = new Date(scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        set({ toastMsg: `Scheduled: "${task}" at ${timeStr}` });
      },
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(s => s.id !== id)
      })),
      deleteScheduleByIndex: (index) => set((state) => {
        const newSchedules = [...state.schedules];
        if (index >= 0 && index < newSchedules.length) {
          newSchedules.splice(index, 1);
          return { schedules: newSchedules };
        }
        return {};
      }),
      checkCallbacks: () => {
        const { mode, callbacks, schedules, setupStep, startPanicSession } = get();
        if (mode !== "idle" || setupStep !== "idle") return;

        // Priority:
        // 1. Callbacks (run as soon as idle)
        // 2. Schedules (run if due)

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
            // Reschedule
            const nextTime = calculateNextRun(schedule.scheduledTime!, schedule.recurrence);
            newSchedules[dueScheduledIdx] = { ...schedule, scheduledTime: nextTime };
          } else {
            // Remove
            newSchedules.splice(dueScheduledIdx, 1);
          }
          
          set({ schedules: newSchedules });
          startPanicSession(schedule.task, schedule.duration, schedule.duration, 3);
          set({ toastMsg: `Forced chore: ${schedule.task}` });
        }
      },
      setCallbacksInput: (callbacksInput) => set({ callbacksInput }),
      setSchedulesInput: (schedulesInput) => set({ schedulesInput }),
      addCallbackDirect: () => {
        const { callbacksInput, addCallback } = get();
        if (!callbacksInput.trim()) return;
        
        const parts = callbacksInput.trim().split(" ");
        const firstPart = parts[0];
        const duration = parseDuration(firstPart);
        if (duration && duration > 0) {
          addCallback(parts.slice(1).join(" ") || "Unnamed Callback", duration);
        } else {
          addCallback(callbacksInput.trim(), 120); 
        }
        set({ callbacksInput: "" });
      },
      addScheduleDirect: () => {
        const { schedulesInput, addSchedule } = get();
        if (!schedulesInput.trim()) return;
        
        const parts = schedulesInput.trim().split(" ");
        const timeStr = parts[0].toLowerCase();
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
          
          const taskName = parts.slice(1).join(" ") || "Scheduled Chore";
          addSchedule(taskName, 120, scheduledDate.getTime());
          set({ schedulesInput: "" });
        } else {
          set({ toastMsg: "Invalid time format. Use HH:MM or 5pm." });
        }
      },
      setShowRecurrenceModal: (showRecurrenceModal) => set({ showRecurrenceModal }),
      setRecurrence: (taskId, recurrence) => set((state) => {
        const newSchedules = state.schedules.map(s => 
          s.id === taskId ? { ...s, recurrence } : s
        );
        return { schedules: newSchedules };
      }),
    }),
    {
      name: "lockin-store-state",
      partialize: (state) => ({
        mode: state.mode,
        queue: state.queue,
        session: state.session,
        sessions: state.sessions,
        wrapData: state.wrapData,
        idleSidetracks: state.idleSidetracks,
        showHistoryPanel: state.showHistoryPanel,
        showInboxPanel: state.showInboxPanel,
        showTasksPanel: state.showTasksPanel,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        showPanicModal: state.showPanicModal,
        zenMode: state.zenMode,
        triageSidetracks: state.triageSidetracks,
        activeTriageIndex: state.activeTriageIndex,
        stash: state.stash,
        activeArchiveId: state.activeArchiveId,
        activeArchiveLabel: state.activeArchiveLabel,
        callbacks: state.callbacks,
        schedules: state.schedules,
        showCallbacksPanel: state.showCallbacksPanel,
        showSchedulesPanel: state.showSchedulesPanel,
      }),
    }
  )
);
