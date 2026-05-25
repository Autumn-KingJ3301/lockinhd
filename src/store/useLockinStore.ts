import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createUISlice, type UISlice } from "./slices/uiSlice";
import { createTaskSlice, type TaskSlice } from "./slices/taskSlice";
import { createArchiveSlice, type ArchiveSlice } from "./slices/archiveSlice";
import { createSessionSlice, type SessionSlice } from "./slices/sessionSlice";
import {
  BRAINSTORM_SCHEMA_VERSION,
  createBrainstormSlice,
  sanitizeBrainstormBoard,
  type BrainstormSlice,
} from "./slices/brainstormSlice";

export type LockinStore = UISlice & TaskSlice & ArchiveSlice & SessionSlice & BrainstormSlice;

export const useLockinStore = create<LockinStore>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createTaskSlice(...a),
      ...createArchiveSlice(...a),
      ...createSessionSlice(...a),
      ...createBrainstormSlice(...a),
    }),
    {
      name: "lockin-store-state",
      merge: (persistedState, currentState) => {
        const nextState = {
          ...currentState,
          ...(persistedState as Partial<LockinStore>),
        };

        const persistedVersion = (persistedState as Partial<LockinStore> & { brainstormSchemaVersion?: number })
          ?.brainstormSchemaVersion;

        return {
          ...nextState,
          brainstormSchemaVersion: BRAINSTORM_SCHEMA_VERSION,
          boards:
            persistedVersion === BRAINSTORM_SCHEMA_VERSION && Array.isArray(nextState.boards)
              ? nextState.boards.map(sanitizeBrainstormBoard)
              : [],
          activeBoardId:
            persistedVersion === BRAINSTORM_SCHEMA_VERSION && typeof nextState.activeBoardId === "string"
              ? nextState.activeBoardId
              : null,
        };
      },
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
        brainstormSchemaVersion: state.brainstormSchemaVersion,
        boards: state.boards,
        activeBoardId: state.activeBoardId,
      }),
    }
  )
);
