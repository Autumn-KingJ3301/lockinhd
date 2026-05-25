import { StateCreator } from "zustand";
import { LockinStore } from "../useLockinStore";
import { AppMode, Theme } from "../../types";

export interface UISlice {
  mode: AppMode;
  input: string;
  dismissedSuggestions: boolean;
  selectedSuggestionIndex: number;
  toastMsg: string | null;
  showHistoryPanel: boolean;
  showInboxPanel: boolean;
  theme: Theme;
  isSystemDark: boolean;
  zenMode: boolean;
  soundEnabled: boolean;
  showHelp: boolean;
  showPanicModal: boolean;
  showTasksPanel: boolean;
  showCallbacksPanel: boolean;
  showSchedulesPanel: boolean;
  showArchivesPanel: boolean;
  archiveConfirmPending: boolean;
  showRecurrenceModal: boolean;
  recurrenceModalTaskId: number | null;
  showTraceInline: boolean;
  callbacksInput: string;
  schedulesInput: string;

  setMode: (mode: AppMode) => void;
  setInput: (input: string) => void;
  setTheme: (theme: Theme) => void;
  setIsSystemDark: (val: boolean) => void;
  setShowHistoryPanel: (val: boolean) => void;
  setShowInboxPanel: (val: boolean) => void;
  setZenMode: (val: boolean) => void;
  toggleZenMode: () => void;
  setSoundEnabled: (val: boolean) => void;
  setToastMsg: (msg: string | null) => void;
  setDismissedSuggestions: (val: boolean) => void;
  setSelectedSuggestionIndex: (idx: number) => void;
  setShowHelp: (val: boolean) => void;
  toggleHelp: () => void;
  setShowPanicModal: (val: boolean) => void;
  setShowTasksPanel: (val: boolean) => void;
  setShowCallbacksPanel: (val: boolean) => void;
  toggleCallbacksPanel: () => void;
  setShowSchedulesPanel: (val: boolean) => void;
  toggleSchedulesPanel: () => void;
  setShowArchivesPanel: (val: boolean) => void;
  toggleArchivesPanel: () => void;
  setArchiveConfirmPending: (val: boolean) => void;
  setShowRecurrenceModal: (val: boolean) => void;
  setCallbacksInput: (val: string) => void;
  setSchedulesInput: (val: string) => void;
  toggleTrace: (val?: boolean) => void;
}

export const createUISlice: StateCreator<LockinStore, [], [], UISlice> = (set) => ({
  mode: "idle",
  input: "",
  dismissedSuggestions: false,
  selectedSuggestionIndex: -1,
  toastMsg: null,
  showHistoryPanel: true,
  showInboxPanel: true,
  theme: "system",
  isSystemDark: false,
  zenMode: false,
  soundEnabled: true,
  showHelp: false,
  showPanicModal: true,
  showTasksPanel: true,
  showCallbacksPanel: false,
  showSchedulesPanel: false,
  showArchivesPanel: false,
  archiveConfirmPending: false,
  showRecurrenceModal: false,
  recurrenceModalTaskId: null,
  showTraceInline: false,
  callbacksInput: "",
  schedulesInput: "",

  setMode: (mode) => set({ mode }),
  setInput: (input) => set({ input }),
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
  setZenMode: (zenMode) => set({ zenMode }),
  toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setToastMsg: (toastMsg) => set({ toastMsg }),
  setDismissedSuggestions: (dismissedSuggestions) => set({ dismissedSuggestions }),
  setSelectedSuggestionIndex: (selectedSuggestionIndex) => set({ selectedSuggestionIndex }),
  setShowHelp: (showHelp) => set({ showHelp }),
  toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  setShowPanicModal: (showPanicModal) => set({ showPanicModal }),
  setShowTasksPanel: (showTasksPanel) => set({ showTasksPanel }),
  setShowCallbacksPanel: (showCallbacksPanel) => set({ showCallbacksPanel }),
  toggleCallbacksPanel: () => set((state) => ({ showCallbacksPanel: !state.showCallbacksPanel })),
  setShowSchedulesPanel: (showSchedulesPanel) => set({ showSchedulesPanel }),
  toggleSchedulesPanel: () => set((state) => ({ showSchedulesPanel: !state.showSchedulesPanel })),
  setShowArchivesPanel: (showArchivesPanel) => set({ showArchivesPanel }),
  toggleArchivesPanel: () => set((state) => ({ showArchivesPanel: !state.showArchivesPanel })),
  setArchiveConfirmPending: (val) => set({ archiveConfirmPending: val }),
  setShowRecurrenceModal: (val) => set({ showRecurrenceModal: val }),
  setCallbacksInput: (callbacksInput) => set({ callbacksInput }),
  setSchedulesInput: (schedulesInput) => set({ schedulesInput }),
  toggleTrace: (val) => set((state) => ({ 
    showTraceInline: val !== undefined ? val : !state.showTraceInline 
  })),
});
