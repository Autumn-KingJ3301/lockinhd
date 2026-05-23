export type Note = {
  text: string;
  ts: number; // Date.now()
};

export type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

export type Session = {
  id?: number; // Unique identifier (typically the initial startTime)
  task: string;
  startTime: number; // Start of current run
  notes: Note[];
  todos?: TodoItem[];
  sidetracks?: string[];
  duration?: number; // Total accumulated duration in seconds
  endTime?: number; // End of current run
  accumulatedDuration?: number; // Seconds spent in prior runs
  revision?: number; // Revision number (starts at 1)
  resumeCue?: string;
};

export type QueueItem = {
  id: number; // Date.now() used as id
  text: string;
};

export type AppMode = "idle" | "active" | "wrap";
export type Theme = "system" | "light" | "dark";
