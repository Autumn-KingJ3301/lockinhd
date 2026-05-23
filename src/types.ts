export type Note = {
  text: string;
  ts: number; // Date.now()
};

export type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

export type SessionRevision = {
  revisionNumber: number;
  startTime: number;
  endTime?: number;
  duration: number; // Duration of *this* specific revision
  notes: Note[];
  todos: TodoItem[]; // Snapshot of todos as they were at the end of this revision
  sidetracks: string[];
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
  revisionHistory?: SessionRevision[];
  panicEndElapsed?: number; // The elapsed second value at which the panic timer expires
  panicLimit?: number; // The total limit in seconds set for panic (e.g., 300)
};

export type QueueItem = {
  id: number; // Date.now() used as id
  text: string;
};

export type AppMode = "idle" | "active" | "wrap";
export type Theme = "system" | "light" | "dark";
