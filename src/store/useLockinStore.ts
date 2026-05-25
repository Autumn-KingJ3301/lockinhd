import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createTaskSlice, TaskSlice } from "./slices/taskSlice";
import { createArchiveSlice, ArchiveSlice } from "./slices/archiveSlice";
import { createSessionSlice, SessionSlice } from "./slices/sessionSlice";

export type LockinStore = UISlice & TaskSlice & ArchiveSlice & SessionSlice;

export const useLockinStore = create<LockinStore>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createTaskSlice(...a),
      ...createArchiveSlice(...a),
      ...createSessionSlice(...a),
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
        journals: state.journals,
      }),
    }
  )
);
