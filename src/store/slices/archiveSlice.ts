import type { StateCreator } from "zustand";
import type { LockinStore } from "../useLockinStore";
import type { Archive, StashData, JournalEntry, Session, SessionTrend } from "../../types";
import { useAuthStore } from "../useAuthStore";

export interface ArchiveSlice {
  archives: Archive[];
  stash: StashData | null;
  archivesLoading: boolean;
  activeArchiveId: string | null;
  activeArchiveLabel: string | null;
  journals: JournalEntry[];
  journalsLoading: boolean;
  selectedHistorySession: Session | null;
  selectedRevisionIndex: number | null;
  pendingTrend: SessionTrend | null;

  setArchives: (archives: Archive[]) => void;
  setArchivesLoading: (val: boolean) => void;
  setStash: (stash: StashData | null) => void;
  clearPendingTrend: () => void;
  createArchive: (label?: string) => Archive;
  restoreArchive: (archiveId: string) => { stashCreated: boolean };
  popStash: () => void;
  discardStash: () => void;
  closeArchive: () => void;
  saveJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  setJournals: (journals: JournalEntry[]) => void;
  setJournalsLoading: (loading: boolean) => void;
  toggleStarSession: (sessionId: number) => void;
  setSelectedHistorySession: (session: Session | null) => void;
  setSelectedRevisionIndex: (idx: number | null) => void;
}

export const createArchiveSlice: StateCreator<LockinStore, [], [], ArchiveSlice> = (set, get) => ({
  archives: [],
  stash: null,
  archivesLoading: false,
  activeArchiveId: null,
  activeArchiveLabel: null,
  journals: [],
  journalsLoading: false,
  selectedHistorySession: null,
  selectedRevisionIndex: null,
  pendingTrend: null,

  setArchives: (archives) => set({ archives }),
  setArchivesLoading: (val) => set({ archivesLoading: val }),
  setStash: (stash) => set({ stash }),
  clearPendingTrend: () => set({ pendingTrend: null }),
  setSelectedHistorySession: (selectedHistorySession) => set({ selectedHistorySession }),
  setSelectedRevisionIndex: (idx) => set({ selectedRevisionIndex: idx }),

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
      boards: [...state.boards],
    };
    set({
      sessions: [],
      queue: [],
      idleSidetracks: [],
      wrapData: null,
      boards: [],
      activeBoardId: null,
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

    const hasContent =
      state.sessions.length > 0 ||
      state.queue.length > 0 ||
      state.idleSidetracks.length > 0 ||
      state.boards.length > 0;

    const newStash: StashData | null = hasContent
      ? {
          sessions: [...state.sessions],
          queue: [...state.queue],
          idleSidetracks: [...state.idleSidetracks],
          wrapData: state.wrapData,
          boards: [...state.boards],
          stashedAt: Date.now(),
        }
      : null;

    set({
      sessions: archive.sessions,
      queue: archive.queue,
      idleSidetracks: archive.idleSidetracks,
      wrapData: archive.wrapData,
      boards: archive.boards || [],
      activeBoardId: archive.boards && archive.boards.length > 0 ? archive.boards[0].id : null,
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
      boards: stash.boards || [],
      activeBoardId: stash.boards && stash.boards.length > 0 ? stash.boards[0].id : null,
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
        boards: stash.boards || [],
        activeBoardId: stash.boards && stash.boards.length > 0 ? stash.boards[0].id : null,
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
        boards: [],
        activeBoardId: null,
        mode: "idle",
        session: null,
        activeArchiveId: null,
        activeArchiveLabel: null,
      });
    }
  },

  saveJournalEntry: async (entry) => {
    const { journals } = get();
    const exists = journals.some(j => j.id === entry.id);
    const updated = exists
      ? journals.map(j => j.id === entry.id ? entry : j)
      : [entry, ...journals];
    
    set({ journals: updated });

    const user = useAuthStore.getState().user;
    if (user) {
      set({ toastMsg: "Reflection saved. Syncing to cloud..." });
    } else {
      set({ toastMsg: "Saved locally (not logged in)." });
    }
  },

  deleteJournalEntry: async (id) => {
    const { journals } = get();
    set({ journals: journals.filter(j => j.id !== id) });

    const user = useAuthStore.getState().user;
    if (user) {
      set({ toastMsg: "Reflection deleted. Syncing to cloud..." });
    } else {
      set({ toastMsg: "Reflection deleted locally." });
    }
  },

  setJournals: (journals) => set({ journals }),
  setJournalsLoading: (journalsLoading) => set({ journalsLoading }),

  toggleStarSession: (sessionId) => {
    set((state) => {
      const updatedSessions = state.sessions.map((s) => {
        if ((s.id || s.startTime) === sessionId) {
          return { ...s, isStarred: !s.isStarred };
        }
        return s;
      });

      let updatedSelected = state.selectedHistorySession;
      if (
        state.selectedHistorySession &&
        (state.selectedHistorySession.id || state.selectedHistorySession.startTime) === sessionId
      ) {
        updatedSelected = {
          ...state.selectedHistorySession,
          isStarred: !state.selectedHistorySession.isStarred,
        };
      }

      let updatedWrap = state.wrapData;
      if (state.wrapData && (state.wrapData.id || state.wrapData.startTime) === sessionId) {
        updatedWrap = {
          ...state.wrapData,
          isStarred: !state.wrapData.isStarred,
        };
      }

      return {
        sessions: updatedSessions,
        selectedHistorySession: updatedSelected,
        wrapData: updatedWrap,
      };
    });
  },
});
