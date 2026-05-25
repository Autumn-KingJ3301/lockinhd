import type { StateCreator } from "zustand";
import type { LockinStore } from "../useLockinStore";
import type { QueueItem, CallbackTask, RecurrenceData } from "../../types";
import { parseDuration } from "../../utils/commandParser";

export interface TaskSlice {
  queue: QueueItem[];
  idleSidetracks: string[];
  triageSidetracks: string[];
  activeTriageIndex: number;
  callbacks: CallbackTask[];
  schedules: CallbackTask[];

  addToQueue: (taskText: string) => void;
  deleteQueueItem: (id: number) => void;
  addSidetrack: (text: string) => void;
  deleteIdleSidetrack: (index: number) => void;
  addIdleSidetrackDirect: () => void;
  processCurrentTriage: (action: "queue" | "start" | "delete" | "keep") => void;
  addCallback: (task: string, duration: number) => void;
  deleteCallback: (id: number) => void;
  deleteCallbackByIndex: (index: number) => void;
  addSchedule: (task: string, duration: number, scheduledTime: number, id?: number) => void;
  deleteSchedule: (id: number) => void;
  deleteScheduleByIndex: (index: number) => void;
  addCallbackDirect: () => void;
  addScheduleDirect: () => void;
  setRecurrence: (taskId: number, recurrence: RecurrenceData | undefined) => void;
}

export const createTaskSlice: StateCreator<LockinStore, [], [], TaskSlice> = (set, get) => ({
  queue: [],
  idleSidetracks: [],
  triageSidetracks: [],
  activeTriageIndex: 0,
  callbacks: [],
  schedules: [],

  addToQueue: (taskText) =>
    set((state) => ({
      queue: [...state.queue, { id: Date.now(), text: taskText }],
    })),
  deleteQueueItem: (id) =>
    set((state) => ({
      queue: state.queue.filter((q) => q.id !== id),
    })),
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

    return {
      queue: updatedQueue,
      idleSidetracks: updatedIdleSidetracks,
      activeTriageIndex: activeTriageIndex + 1,
    };
  }),
  addCallback: (task, duration) => {
    const newCallback: CallbackTask = {
      id: Date.now(),
      task,
      duration,
    };
    set(state => ({
      callbacks: [...state.callbacks, newCallback],
      toastMsg: `Callback added: "${task}" will run after current session.`
    }));
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
    const timeStr = new Date(scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    set(state => ({
      schedules: [...state.schedules, newSchedule],
      toastMsg: `Scheduled: "${task}" at ${timeStr}`
    }));
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
  setRecurrence: (taskId, recurrence) => set((state) => {
    const newSchedules = state.schedules.map(s =>
      s.id === taskId ? { ...s, recurrence } : s
    );
    return { schedules: newSchedules };
  }),
});
