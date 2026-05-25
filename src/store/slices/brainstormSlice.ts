import { type StateCreator } from "zustand";
import {
  type BrainstormBoard,
  type AgendaItem,
  type BrainstormConnection,
  type BrainstormNote,
  type BrainstormTask,
} from "../../types";

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const BRAINSTORM_SCHEMA_VERSION = 3;

const clampNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
) => {
  const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, num));
};

const sanitizeElement = (element: any) => {
  if (!element || typeof element !== "object") return null;

  return {
    ...element,
    x: clampNumber(element.x, 0, -50000, 50000),
    y: clampNumber(element.y, 0, -50000, 50000),
    width: clampNumber(element.width, 10, 1, 8000),
    height: clampNumber(element.height, 10, 1, 8000),
    angle: clampNumber(element.angle, 0, -360, 360),
    opacity: clampNumber(element.opacity, 100, 0, 100),
  };
};

export const sanitizeBrainstormBoard = (board: BrainstormBoard): BrainstormBoard => {
  const appState = board.appState || {};
  const zoomValue = appState.zoom?.value;

  return {
    ...board,
    elements: (board.elements || []).map(sanitizeElement).filter(Boolean),
    notes: Array.isArray(board.notes) ? board.notes : [],
    tasks: Array.isArray(board.tasks) ? board.tasks : [],
    connections: Array.isArray(board.connections) ? board.connections : [],
    appState: {
      ...appState,
      zoom:
        Number.isFinite(zoomValue) && zoomValue > 0.05 && zoomValue < 10
          ? appState.zoom
          : { value: 1 },
      scrollX: 0,
      scrollY: 0,
    },
  };
};

export interface BrainstormSlice {
  boards: BrainstormBoard[];
  activeBoardId: string | null;
  brainstormSchemaVersion: number;
  
  createBoard: (title?: string) => string;
  updateBoard: (id: string, updates: Partial<BrainstormBoard>) => void;
  deleteBoard: (id: string) => void;
  setActiveBoardId: (id: string | null) => void;
  addBrainstormNote: (boardId: string, text: string, canvasElementId?: string) => void;
  updateBrainstormNote: (boardId: string, noteId: string, updates: Partial<BrainstormNote>) => void;
  deleteBrainstormNote: (boardId: string, noteId: string) => void;
  addBrainstormTask: (boardId: string, text: string) => void;
  toggleBrainstormTask: (boardId: string, taskId: string) => void;
  deleteBrainstormTask: (boardId: string, taskId: string) => void;
  addBrainstormConnection: (boardId: string, fromId: string, toId: string, label?: string) => void;
  deleteBrainstormConnection: (boardId: string, connectionId: string) => void;

  // Backward compatible agenda helpers
  addAgendaItem: (boardId: string, text: string) => void;
  toggleAgendaItem: (boardId: string, itemId: string) => void;
  deleteAgendaItem: (boardId: string, itemId: string) => void;
}

export const createBrainstormSlice: StateCreator<
  BrainstormSlice,
  [],
  [],
  BrainstormSlice
> = (set) => ({
  boards: [],
  activeBoardId: null,
  brainstormSchemaVersion: BRAINSTORM_SCHEMA_VERSION,

  createBoard: (title) => {
    const id = createId("board");
    const newBoard: BrainstormBoard = {
      id,
      title: title || `Untitled Board`,
      elements: [],
      appState: {},
      agenda: [],
      notes: [],
      tasks: [],
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    
    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: id,
    }));
    
    return id;
  },

  updateBoard: (id, updates) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === id
          ? sanitizeBrainstormBoard({
              ...board,
              ...updates,
              updatedAt: Date.now(),
            })
          : board
      ),
    }));
  },

  deleteBoard: (id) => {
    set((state) => {
      const nextBoards = state.boards.filter((b) => b.id !== id);
      const nextActiveId = state.activeBoardId === id
        ? (nextBoards.length > 0 ? nextBoards[0].id : null)
        : state.activeBoardId;
      return {
        boards: nextBoards,
        activeBoardId: nextActiveId,
      };
    });
  },

  setActiveBoardId: (id) => {
    set({ activeBoardId: id });
  },

  addBrainstormNote: (boardId, text, canvasElementId) => {
    const newNote: BrainstormNote = {
      id: createId("note"),
      text,
      createdAt: Date.now(),
      canvasElementId,
    };
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              notes: [...(board.notes || []), newNote],
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  updateBrainstormNote: (boardId, noteId, updates) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              notes: (board.notes || []).map((note) =>
                note.id === noteId ? { ...note, ...updates } : note
              ),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  deleteBrainstormNote: (boardId, noteId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              notes: (board.notes || []).filter((note) => note.id !== noteId),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  addBrainstormTask: (boardId, text) => {
    const newTask: BrainstormTask = {
      id: createId("task"),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              tasks: [...(board.tasks || []), newTask],
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  toggleBrainstormTask: (boardId, taskId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              tasks: (board.tasks || []).map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              ),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  deleteBrainstormTask: (boardId, taskId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              tasks: (board.tasks || []).filter((task) => task.id !== taskId),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  addBrainstormConnection: (boardId, fromId, toId, label) => {
    const connection: BrainstormConnection = {
      id: createId("conn"),
      fromId,
      toId,
      label,
      createdAt: Date.now(),
    };
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              connections: [...(board.connections || []), connection],
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  deleteBrainstormConnection: (boardId, connectionId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              connections: (board.connections || []).filter((c) => c.id !== connectionId),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  addAgendaItem: (boardId, text) => {
    const newItem: AgendaItem = {
      id: createId("agenda"),
      text,
      completed: false,
    };
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              agenda: [...board.agenda, newItem],
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  toggleAgendaItem: (boardId, itemId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              agenda: board.agenda.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },

  deleteAgendaItem: (boardId, itemId) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              agenda: board.agenda.filter((item) => item.id !== itemId),
              updatedAt: Date.now(),
            }
          : board
      ),
    }));
  },
});
