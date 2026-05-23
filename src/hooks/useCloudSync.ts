import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLockinStore } from "../store/useLockinStore";
import { apiService, type LockinData } from "../services/apiService";
import type { Note, TodoItem, Session, SessionRevision } from "../types";

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
    isArrayEqual(a.idleSidetracks || [], b.idleSidetracks || [], (x, y) => x === y) &&
    isArrayEqual(a.triageSidetracks || [], b.triageSidetracks || [], (x, y) => x === y) &&
    isArrayEqual(a.queue || [], b.queue || [], (x, y) => x.id === y.id && x.text === y.text) &&
    isSessionEqual(a.session, b.session) &&
    isSessionEqual(a.wrapData, b.wrapData) &&
    isArrayEqual(a.sessions || [], b.sessions || [], isSessionEqual)
  );
}

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const setCloudData = useLockinStore((state) => state.setCloudData);
  
  // Use a ref to prevent saving data that was just loaded
  const isInitialLoad = useRef(true);

  // Load user data on login
  useEffect(() => {
    if (initialized && user) {
      const loadData = async () => {
        try {
          const data = await apiService.loadUserData(user.uid);
          if (data) {
            setCloudData(data);
          }
        } catch (error) {
          console.error("Failed to load user data from cloud:", error);
        } finally {
          // Add a short delay to ensure Zustand state propagates and triggering effects/subscribers settle
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      };
      loadData();
    } else if (initialized && !user) {
      isInitialLoad.current = true;
    }
  }, [user, initialized, setCloudData]);

  // Sync state to cloud on changes
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
      };

      // 1. Skip sync if values are equal to what we already saved/queued
      if (lastSavedData && isDataEqual(lastSavedData, dataToSave)) {
        return;
      }

      // Update the reference of what we want to save
      lastSavedData = dataToSave;

      // 2. Clear any existing debounce timer to cancel obsolete writes
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 3. Schedule a new debounced write
      debounceTimer = setTimeout(() => {
        apiService.saveUserData(user.uid, dataToSave)
          .then(() => {
            console.log("Cloud sync successful");
          })
          .catch((err) => {
            console.error("Failed to save user data to cloud:", err);
          });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [user]);
};
