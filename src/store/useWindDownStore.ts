import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useLockinStore } from "./useLockinStore";
import type { WindDownLog } from "../types";

interface WindDownStoreState {
  windDownLogs: WindDownLog[];
  activeActivityId: string | null;
  windDownStartTime: number | null;
  moodRatingBefore: number | null;
  moodRatingAfter: number | null;
  tempAssociatedSession: { id: number; task: string; duration: number; endTime: number } | null;
}

interface WindDownStoreActions {
  enterWindDown: () => boolean; // returns false if not in idle mode
  exitWindDown: (moodAfter?: number) => void;
  selectActivity: (activityId: string | null) => void;
  setMoodBefore: (mood: number | null) => void;
  setMoodAfter: (mood: number | null) => void;
  logWindDownSession: (log: WindDownLog) => void;
  clearLogs: () => void;
}

export type WindDownStore = WindDownStoreState & WindDownStoreActions;

export const useWindDownStore = create<WindDownStore>()(
  persist(
    (set, get) => ({
      windDownLogs: [],
      activeActivityId: null,
      windDownStartTime: null,
      moodRatingBefore: null,
      moodRatingAfter: null,
      tempAssociatedSession: null,

      enterWindDown: () => {
        const lockinState = useLockinStore.getState();
        // Check if we are currently in idle mode
        if (lockinState.mode !== "idle") {
          return false;
        }

        // Set Lockin mode to wind-down
        useLockinStore.setState({ mode: "wind-down" });

        // Get the last completed focus session in history to associate with this wind-down
        const lastSession = lockinState.sessions.length > 0 
          ? lockinState.sessions[lockinState.sessions.length - 1] 
          : null;

        let associated = null;
        if (lastSession && lastSession.endTime && lastSession.duration) {
          associated = {
            id: lastSession.id || lastSession.startTime,
            task: lastSession.task,
            duration: lastSession.duration,
            endTime: lastSession.endTime,
          };
        }

        // Set Lockin mode to wind-down
        useLockinStore.setState({ mode: "wind-down" });

        set({
          windDownStartTime: Date.now(),
          activeActivityId: null,
          moodRatingBefore: null,
          moodRatingAfter: null,
          tempAssociatedSession: associated,
        });

        return true;
      },

      exitWindDown: (moodAfter) => {
        const { windDownStartTime, activeActivityId, moodRatingBefore, tempAssociatedSession } = get();
        const endTime = Date.now();
        const startTime = windDownStartTime || endTime;
        const duration = Math.max(1, Math.round((endTime - startTime) / 1000));
        const finalMoodAfter = moodAfter !== undefined ? moodAfter : get().moodRatingAfter;

        const newLog: WindDownLog = {
          id: startTime,
          startTime,
          endTime,
          duration,
          moodRatingBefore: moodRatingBefore ?? undefined,
          moodRatingAfter: finalMoodAfter ?? undefined,
        };

        if (activeActivityId) {
          newLog.activityId = activeActivityId;
          // Simple display name mapping for standard activities
          const names: Record<string, string> = {
            breathing: "Box Breathing",
            meditation: "Mindful Meditation",
            stretching: "Desk Stretching",
          };
          newLog.activityName = names[activeActivityId] || activeActivityId;
        }

        if (tempAssociatedSession) {
          newLog.associatedSessionId = tempAssociatedSession.id;
          newLog.associatedSessionTask = tempAssociatedSession.task;
          newLog.associatedSessionDuration = tempAssociatedSession.duration;
        }

        // Log the session locally in windDownLogs
        set((state) => ({
          windDownLogs: [...state.windDownLogs, newLog],
          windDownStartTime: null,
          activeActivityId: null,
          moodRatingBefore: null,
          moodRatingAfter: null,
          tempAssociatedSession: null,
        }));

        // Trigger a change to today's journal entry to snapshot this wind down log!
        try {
          const todayStr = new Date().toISOString().split("T")[0];
          const lockinStore = useLockinStore.getState();
          const existingEntry = lockinStore.journals.find((j) => j.date === todayStr);
          if (existingEntry) {
            const currentWindDowns = existingEntry.windDownSnapshot || [];
            const updatedEntry = {
              ...existingEntry,
              windDownSnapshot: [...currentWindDowns, newLog],
            };
            lockinStore.saveJournalEntry(updatedEntry);
          }
        } catch (e) {
          console.warn("Could not snapshot wind down log to today's journal:", e);
        }

        // Return lockin state to idle
        useLockinStore.setState({ mode: "idle" });
      },

      selectActivity: (activityId) => {
        set({ activeActivityId: activityId });
      },

      setMoodBefore: (mood) => {
        set({ moodRatingBefore: mood });
      },

      setMoodAfter: (mood) => {
        set({ moodRatingAfter: mood });
      },

      logWindDownSession: (log) => {
        set((state) => ({
          windDownLogs: [...state.windDownLogs, log],
        }));
      },

      clearLogs: () => {
        set({ windDownLogs: [] });
      },
    }),
    {
      name: "lockin-wind-down-store",
    }
  )
);
