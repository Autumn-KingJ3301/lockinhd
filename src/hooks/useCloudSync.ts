import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLockinStore } from "../store/useLockinStore";
import { apiService, type LockinData } from "../services/apiService";
import type { Note, TodoItem, Session, SessionRevision, CallbackTask, JournalEntry } from "../types";

function isArrayEqual<T>(a: T[], b: T[], itemEqual: (x: T, y: T) => boolean): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!itemEqual(a[i], b[i])) return false;
  }
  return true;
}

function isTodoItemEqual(a: TodoItem, b: TodoItem): boolean {
  return a.id === b.id && a.text === b.text && a.completed === b.completed;
}

function isNoteEqual(a: Note, b: Note): boolean {
  return a.text === b.text && a.ts === b.ts;
}

function isSessionRevisionEqual(a: SessionRevision, b: SessionRevision): boolean {
  return (
    a.revisionNumber === b.revisionNumber &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.duration === b.duration &&
    isArrayEqual(a.notes || [], b.notes || [], isNoteEqual) &&
    isArrayEqual(a.todos || [], b.todos || [], isTodoItemEqual) &&
    isArrayEqual(a.sidetracks || [], b.sidetracks || [], (x, y) => x === y)
  );
}

function isSessionEqual(a: Session | null, b: Session | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.task === b.task &&
    a.startTime === b.startTime &&
    a.duration === b.duration &&
    a.endTime === b.endTime &&
    a.accumulatedDuration === b.accumulatedDuration &&
    a.revision === b.revision &&
    a.resumeCue === b.resumeCue &&
    a.panicEndElapsed === b.panicEndElapsed &&
    a.panicLimit === b.panicLimit &&
    a.timerEndElapsed === b.timerEndElapsed &&
    isArrayEqual(a.notes || [], b.notes || [], isNoteEqual) &&
    isArrayEqual(a.todos || [], b.todos || [], isTodoItemEqual) &&
    isArrayEqual(a.sidetracks || [], b.sidetracks || [], (x, y) => x === y) &&
    isArrayEqual(a.revisionHistory || [], b.revisionHistory || [], isSessionRevisionEqual)
  );
}

function isCallbackEqual(a: CallbackTask, b: CallbackTask): boolean {
  return a.id === b.id && a.task === b.task && a.duration === b.duration && a.scheduledTime === b.scheduledTime;
}

function isJournalEntryEqual(a: JournalEntry, b: JournalEntry): boolean {
  return (
    a.id === b.id &&
    a.createdAt === b.createdAt &&
    a.date === b.date &&
    a.title === b.title &&
    a.content === b.content
  );
}

function isDataEqual(a: LockinData, b: LockinData): boolean {
  return (
    a.mode === b.mode &&
    a.showHistoryPanel === b.showHistoryPanel &&
    a.showInboxPanel === b.showInboxPanel &&
    a.showTasksPanel === b.showTasksPanel &&
    a.showPanicModal === b.showPanicModal &&
    a.theme === b.theme &&
    a.soundEnabled === b.soundEnabled &&
    a.zenMode === b.zenMode &&
    a.activeTriageIndex === b.activeTriageIndex &&
    a.activeArchiveId === b.activeArchiveId &&
    a.activeArchiveLabel === b.activeArchiveLabel &&
    isArrayEqual(a.idleSidetracks || [], b.idleSidetracks || [], (x, y) => x === y) &&
    isArrayEqual(a.triageSidetracks || [], b.triageSidetracks || [], (x, y) => x === y) &&
    isArrayEqual(a.queue || [], b.queue || [], (x, y) => x.id === y.id && x.text === y.text) &&
    isArrayEqual(a.callbacks || [], b.callbacks || [], isCallbackEqual) &&
    isArrayEqual(a.schedules || [], b.schedules || [], isCallbackEqual) &&
    isSessionEqual(a.session, b.session) &&
    isSessionEqual(a.wrapData, b.wrapData) &&
    isArrayEqual(a.sessions || [], b.sessions || [], isSessionEqual) &&
    isArrayEqual(a.journals || [], b.journals || [], isJournalEntryEqual)
  );
}

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const setCloudData = useLockinStore((state) => state.setCloudData);
  const setArchives = useLockinStore((state) => state.setArchives);
  const setArchivesLoading = useLockinStore((state) => state.setArchivesLoading);
  const setStash = useLockinStore((state) => state.setStash);
  const clearPendingTrend = useLockinStore((state) => state.clearPendingTrend);
  const setJournalsLoading = useLockinStore((state) => state.setJournalsLoading);

  // Use a ref to prevent saving data that was just loaded
  const isInitialLoad = useRef(true);

  // Load user data on login (workspace + archives + stash + journals)
  useEffect(() => {
    if (initialized && user) {
      const loadData = async () => {
        try {
          setArchivesLoading(true);
          setJournalsLoading(true);

          // Load main workspace
          const data = await apiService.loadUserData(user.uid);
          if (data) {
            setCloudData(data);
          }

          // Load archives
          const archives = await apiService.loadArchives(user.uid);
          setArchives(archives);

          // Load stash
          const stash = await apiService.loadStash(user.uid);
          if (stash) {
            setStash(stash);
          }
        } catch (error) {
          console.error("Failed to load user data from cloud:", error);
        } finally {
          setArchivesLoading(false);
          setJournalsLoading(false);
          // Add a short delay to ensure Zustand state propagates
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      };
      loadData();
    } else if (initialized && !user) {
      isInitialLoad.current = true;
    }
  }, [user, initialized, setCloudData, setArchives, setArchivesLoading, setStash, setJournalsLoading]);

  // Watch for pendingTrend and write to Firestore immediately
  useEffect(() => {
    if (!user) return;

    const unsubscribe = useLockinStore.subscribe((state) => {
      if (!state.pendingTrend) return;
      const trend = state.pendingTrend;

      // Clear it first to avoid duplicate writes
      clearPendingTrend();

      apiService.saveSessionTrend(user.uid, trend)
        .then(() => console.log("Session trend saved:", trend.sessionId))
        .catch((err) => console.error("Failed to save session trend:", err));
    });

    return () => unsubscribe();
  }, [user, clearPendingTrend]);

  // Sync state to cloud on changes (debounced)
  useEffect(() => {
    if (!user) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastSavedData: LockinData | null = null;

    const unsubscribe = useLockinStore.subscribe((state) => {
      if (isInitialLoad.current) return;

      const dataToSave: LockinData = {
        mode: state.mode,
        queue: state.queue,
        session: state.session,
        sessions: state.sessions,
        wrapData: state.wrapData,
        idleSidetracks: state.idleSidetracks,
        showHistoryPanel: state.showHistoryPanel,
        showInboxPanel: state.showInboxPanel,
        showTasksPanel: state.showTasksPanel,
        showPanicModal: state.showPanicModal,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        zenMode: state.zenMode,
        triageSidetracks: state.triageSidetracks,
        activeTriageIndex: state.activeTriageIndex,
        activeArchiveId: state.activeArchiveId,
        activeArchiveLabel: state.activeArchiveLabel,
        callbacks: state.callbacks,
        schedules: state.schedules,
        journals: state.journals,
      };

      // Skip sync if values are equal to what we already saved/queued
      if (lastSavedData && isDataEqual(lastSavedData, dataToSave)) {
        return;
      }

      lastSavedData = dataToSave;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        apiService.saveUserData(user.uid, dataToSave)
          .then(() => console.log("Cloud sync successful"))
          .catch((err) => console.error("Failed to save user data to cloud:", err));
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [user]);

  // Sync archive saves triggered externally (from Profile page via createArchive)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = useLockinStore.subscribe((state, prevState) => {
      if (isInitialLoad.current) return;
      // Detect new archive added (length increased)
      if (state.archives.length > prevState.archives.length) {
        const newArchive = state.archives[0]; // most recent is first
        if (newArchive) {
          apiService.saveArchive(user.uid, newArchive)
            .then(() => console.log("Archive saved:", newArchive.id))
            .catch((err) => console.error("Failed to save archive:", err));
        }
      }
      // Detect stash changes
      if (state.stash !== prevState.stash) {
        if (state.stash) {
          apiService.saveStash(user.uid, state.stash)
            .then(() => console.log("Stash saved"))
            .catch((err) => console.error("Failed to save stash:", err));
        } else {
          // Stash was cleared
          apiService.clearStash(user.uid)
            .then(() => console.log("Stash cleared"))
            .catch((err) => console.error("Failed to clear stash:", err));
        }
      }
    });

    return () => unsubscribe();
  }, [user]);
};
