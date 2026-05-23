import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, TodoItem, Session, QueueItem, AppMode, Theme } from "../types";
import { playPopSound, playChimeSound } from "../utils/audioSynth";
import { triggerConfetti } from "../utils/confetti";

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
  startSession: (taskName: string) => void;
  startNextQueuedTask: () => void;
  exitWrapMode: () => void;

  // Session Management
  completeSession: () => void;
  addNote: (text: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (index: number) => void;
  removeTodo: (index: number) => void;

  // Sidetracks
  addSidetrack: (text: string) => void;
  deleteIdleSidetrack: (index: number) => void;
  addIdleSidetrackDirect: () => void; // from quick capture input
  startSessionFromSidetrack: (index: number) => void;
  continueSession: (pastSession: Session) => void;

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
      selectedSuggestionIndex: 0,
      toastMsg: null,
      idleSidetracks: [],
      showHistoryPanel: true,
      showInboxPanel: true,
      selectedHistorySession: null,
      inboxInput: "",
      theme: "system",
      isSystemDark: false,
      zenMode: false,
      soundEnabled: true,
      triageSidetracks: [],
      activeTriageIndex: 0,
      showHelp: false,

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
      startSession: (taskName) => {
        const time = Date.now();
        set({
          session: { id: time, task: taskName, startTime: time, notes: [], revision: 1 },
          elapsed: 0,
          mode: "active",
          wrapData: null,
          input: "",
          triageSidetracks: [],
          activeTriageIndex: 0,
        });
      },
      startNextQueuedTask: () => {
        const { queue } = get();
        if (queue.length > 0) {
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
          });
        }
      },
      exitWrapMode: () => set({ mode: "idle", wrapData: null, triageSidetracks: [], activeTriageIndex: 0 }),

      completeSession: () => {
        const { session, soundEnabled } = get();
        if (session) {
          const endTime = Date.now();
          const runDuration = Math.round((endTime - session.startTime) / 1000);
          const totalDuration = runDuration + (session.accumulatedDuration || 0);
          const completedSession: Session = {
            ...session,
            endTime,
            duration: totalDuration,
          };
          const sessionId = session.id || session.startTime;
          const sessionSidetracks = session.sidetracks || [];

          if (soundEnabled) {
            try { playChimeSound(); } catch (e) {}
          }
          try { triggerConfetti(); } catch (e) {}

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
        const { session, soundEnabled } = get();
        if (session && session.todos && session.todos.length > 0) {
          let todoIdx = index;
          if (todoIdx === -1) {
            todoIdx = session.todos.findIndex((t) => !t.completed);
          }
          if (todoIdx !== -1 && todoIdx >= 0 && todoIdx < session.todos.length) {
            const wasCompleted = session.todos[todoIdx].completed;
            const updated = session.todos.map((todo, idx) =>
              idx === todoIdx ? { ...todo, completed: !todo.completed } : todo
            );
            set({ session: { ...session, todos: updated } });
            // Play pop sound when marking as complete (not when unchecking)
            if (!wasCompleted && soundEnabled) {
              try { playPopSound(); } catch (e) {}
            }
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
        const { idleSidetracks } = get();
        if (index >= 0 && index < idleSidetracks.length) {
          const taskName = idleSidetracks[index];
          const updatedSidetracks = idleSidetracks.filter((_, idx) => idx !== index);
          const time = Date.now();
          set({
            idleSidetracks: updatedSidetracks,
            session: { id: time, task: taskName, startTime: time, notes: [], revision: 1 },
            elapsed: 0,
            mode: "active",
            wrapData: null,
            input: "",
            triageSidetracks: [],
            activeTriageIndex: 0,
          });
        }
      },
      continueSession: (pastSession) => {
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
          },
          elapsed: accumulatedDuration,
          mode: "active",
          wrapData: null,
          input: "",
          selectedHistorySession: null,
          triageSidetracks: [],
          activeTriageIndex: 0,
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
        let updatedQueue = [...queue];
        let updatedIdleSidetracks = [...idleSidetracks];

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
      toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
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
        theme: state.theme,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);
