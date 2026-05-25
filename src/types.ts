export type Note = {
  text: string;
  ts: number; // Date.now()
};

export type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
  timerStartElapsed?: number; // When the standalone timer was started
  timerTargetElapsed?: number; // The elapsed second value at which the sub-timer expires
  timerDuration?: number;     // Accumulated duration in seconds
  isTimerRunning?: boolean;
};

export type SessionRevision = {
  revisionNumber: number;
  startTime: number;
  endTime?: number;
  duration: number; // Duration of *this* specific revision
  notes: Note[];
  todos: TodoItem[]; // Snapshot of todos as they were at the end of this revision
  sidetracks: string[];
  estimatedDuration?: number;
  energyRating?: number;
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
  timerEndElapsed?: number; // The elapsed second value at which the in-session timer expires
  estimatedDuration?: number;
  energyRating?: number;
  isStarred?: boolean;
  brainstormBoardId?: string;
};

export type QueueItem = {
  id: number; // Date.now() used as id
  text: string;
};

export type AppMode = "idle" | "active" | "panic" | "wrap" | "wind-down";
export type Theme = "system" | "light" | "dark";

export type WindDownLog = {
  id: number;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  activityId?: string;
  activityName?: string;
  moodRatingBefore?: number;
  moodRatingAfter?: number;
  associatedSessionId?: number;
  associatedSessionTask?: string;
  associatedSessionDuration?: number;
};

export type CallbackTask = {
  id: number;
  task: string;
  duration: number;
  scheduledTime?: number; // timestamp for /schedule
  recurrence?: RecurrenceData;
};

export type RecurrenceType = "hourly" | "daily" | "weekly" | "custom_days";

export type RecurrenceData = {
  type: RecurrenceType;
  interval?: number; // e.g. every 3 hours
  days?: number[]; // 0-6 for Sun-Sat
};

// Archive: a dated snapshot of workspace data (sessions, queue, inbox)
export type Archive = {
  id: string;
  createdAt: number;
  label: string; // e.g. "May 24, 2026"
  sessions: Session[];
  queue: QueueItem[];
  idleSidetracks: string[];
  wrapData: Session | null;
  boards?: BrainstormBoard[];
};

// Stash: a single temporary workspace snapshot (git-stash style)
export type StashData = {
  sessions: Session[];
  queue: QueueItem[];
  idleSidetracks: string[];
  wrapData: Session | null;
  stashedAt: number;
  boards?: BrainstormBoard[];
};

// SessionTrend: analytics document stored separately in Firestore
export type SessionTrend = {
  sessionId: string; // reference to Session.id
  task: string;
  energyRating: number | null;
  estimatedDuration: number | null;
  actualDuration: number;
  startTime: number;
  endTime: number;
  revisionCount: number;
};

export type JournalPhoto = {
  id: string;
  name?: string;
  url?: string; // base64, only populated locally!
  hasLocalData?: boolean;
};

export type JournalVoiceMemo = {
  id: string;
  label?: string;
  url?: string; // base64, only populated locally!
  duration?: number;
  hasLocalData?: boolean;
};

export type JournalEntry = {
  id: string;
  createdAt: number;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  sessionsSnapshot?: Session[];
  idleSidetracksSnapshot?: string[];
  windDownSnapshot?: WindDownLog[];
  photos?: JournalPhoto[];
  voiceMemos?: JournalVoiceMemo[];
  boardSnapshots?: { boardId: string, boardTitle: string, pngBase64: string }[];
};

export type AgendaItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt?: number;
};

export type BrainstormNote = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  canvasElementId?: string;
};

export type BrainstormTask = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt?: number;
};

export type BrainstormConnection = {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  createdAt: number;
};

export type BrainstormBoard = {
  id: string;
  title: string;
  elements: any[];
  appState: any;
  agenda: AgendaItem[];
  notes: BrainstormNote[];
  tasks: BrainstormTask[];
  connections: BrainstormConnection[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
};
