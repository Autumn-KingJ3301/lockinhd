import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useLockinStore } from "../store/useLockinStore";
import { useThemeStore } from "../store/useThemeStore";
import "./Brainstorm.css";

type BrainstormNote = {
  id: string;
  text: string;
  elementId?: string;
  createdAt: number;
};

type BrainstormTask = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type BrainstormBoard = {
  id: string;
  title: string;
  elements: any[];
  notes: BrainstormNote[];
  tasks: BrainstormTask[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "lockin-brainstorm-v1";

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createBoard = (title = "Brainstorm Board"): BrainstormBoard => ({
  id: createId("board"),
  title,
  elements: [],
  notes: [],
  tasks: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const sanitizeElements = (elements: readonly any[]) =>
  elements
    .filter((element) => element && !element.isDeleted)
    .map((element) => ({
      ...element,
      x: Math.max(-50000, Math.min(50000, Number.isFinite(element.x) ? element.x : 0)),
      y: Math.max(-50000, Math.min(50000, Number.isFinite(element.y) ? element.y : 0)),
      width: Math.max(1, Math.min(8000, Number.isFinite(element.width) ? element.width : 10)),
      height: Math.max(1, Math.min(8000, Number.isFinite(element.height) ? element.height : 10)),
    }));

const loadBoards = (): BrainstormBoard[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createBoard()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.boards) || parsed.boards.length === 0) return [createBoard()];

    return parsed.boards.map((board: Partial<BrainstormBoard>) => ({
      id: typeof board.id === "string" ? board.id : createId("board"),
      title: board.title || "Brainstorm Board",
      elements: sanitizeElements(board.elements || []),
      notes: Array.isArray(board.notes) ? board.notes : [],
      tasks: Array.isArray(board.tasks) ? board.tasks : [],
      createdAt: board.createdAt || Date.now(),
      updatedAt: board.updatedAt || Date.now(),
    }));
  } catch {
    return [createBoard()];
  }
};

// const getSelectedIds = (appState: any) => {
//   const selected = appState?.selectedElementIds;
//   if (!selected || typeof selected !== "object") return [];
//   return Object.keys(selected).filter((id) => selected[id]);
// };

// const areStringArraysEqual = (a: string[], b: string[]) =>
//   a.length === b.length && a.every((item, index) => item === b[index]);

const getSceneSignature = (elements: readonly any[]) =>
  JSON.stringify(
    elements.map((element) => ({
      id: element.id,
      version: element.version,
      versionNonce: element.versionNonce,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      isDeleted: element.isDeleted,
    }))
  );

// const getElementCenter = (element: any) => ({
//   x: (element.x || 0) + (element.width || 0) / 2,
//   y: (element.y || 0) + (element.height || 0) / 2,
// });

const getThemeColor = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export const Brainstorm: React.FC = () => {
  const navigate = useNavigate();
  const appTheme = useLockinStore((state) => state.theme);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const queue = useLockinStore((state) => state.queue);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const activeTheme = useThemeStore((state) => state.getActiveTheme());

  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [boards, setBoards] = useState<BrainstormBoard[]>(() => loadBoards());
  const [activeBoardId, setActiveBoardId] = useState(() => loadBoards()[0]?.id || createBoard().id);
  const [api, setApi] = useState<any>(null);
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const saveTimerRef = useRef<number | null>(null);
  const sceneSignatureRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards }));
  }, [boards]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const excalidrawTheme =
    appTheme === "system" ? (systemPrefersDark ? "dark" : "light") : appTheme;
  const themeLabel = activeTheme?.name || (activeThemeId === "default" ? "Default" : activeThemeId);
  const activeBoard = boards.find((board) => board.id === activeBoardId) || boards[0];

  // const activeElements = activeBoard?.elements || [];

  const updateActiveBoard = (updates: Partial<BrainstormBoard>) => {
    setBoards((current) =>
      current.map((board) =>
        board.id === activeBoard.id
          ? { ...board, ...updates, updatedAt: Date.now() }
          : board
      )
    );
  };

  const saveScene = (elements: readonly any[]) => {
    const sanitizedElements = sanitizeElements(elements);
    const signature = getSceneSignature(sanitizedElements);
    if (sceneSignatureRef.current[activeBoard.id] === signature) return;

    sceneSignatureRef.current[activeBoard.id] = signature;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      updateActiveBoard({ elements: sanitizedElements });
    }, 250);
  };

  const addElements = (nextElements: any[]) => {
    if (!api) return;
    const mergedElements = [...api.getSceneElements(), ...nextElements];
    api.updateScene({ elements: mergedElements });
    updateActiveBoard({ elements: sanitizeElements(mergedElements) });
  };

  const addTextToCanvas = (text: string, source: "note" | "sidetrack" | "task" = "note") => {
    if (!api || !text.trim()) return;
    const appState = api.getAppState();
    const zoom = appState.zoom?.value || 1;
    const x = (-appState.scrollX + 160) / zoom;
    const y = (-appState.scrollY + 120) / zoom;
    const strokeColor =
      source === "task"
        ? getThemeColor("--color-warning", "#f59f00")
        : getThemeColor("--color-accent", "#6965db");
    const elementId = createId(source);
    const [element] = convertToExcalidrawElements(
      [{
        id: elementId,
        type: "text",
        text,
        x,
        y,
        fontSize: 22,
        strokeColor,
      }],
      { regenerateIds: false }
    );

    addElements([element]);

    if (source !== "task") {
      updateActiveBoard({
        notes: [
          ...activeBoard.notes,
          { id: createId("note"), text, elementId, createdAt: Date.now() },
        ],
      });
    }
  };

  const createNewBoard = () => {
    const nextBoard = createBoard(`Brainstorm ${boards.length + 1}`);
    setBoards((current) => [...current, nextBoard]);
    setActiveBoardId(nextBoard.id);
  };

  const deleteBoard = (boardId: string) => {
    const nextBoards = boards.filter((board) => board.id !== boardId);
    const fallbackBoards = nextBoards.length ? nextBoards : [createBoard()];
    setBoards(fallbackBoards);
    if (activeBoardId === boardId) setActiveBoardId(fallbackBoards[0].id);
  };

  const toggleTask = (taskId: string) => {
    updateActiveBoard({
      tasks: activeBoard.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    });
  };

  return (
    <div className="brainstorm-page">
      <header className="brainstorm-header">
        <button className="brainstorm-back-btn" onClick={() => navigate("/")} type="button">
          Back
        </button>
        <div className="brainstorm-heading">
          <input
            className="brainstorm-title-input"
            value={activeBoard?.title || "Brainstorm"}
            onChange={(event) => updateActiveBoard({ title: event.target.value })}
          />
          <span className="brainstorm-theme-pill">{themeLabel}</span>
        </div>
        <div className="brainstorm-actions">
          <button className="brainstorm-back-btn" onClick={createNewBoard} type="button">
            New
          </button>
          <button
            className="brainstorm-back-btn"
            onClick={() => updateActiveBoard({ elements: [] })}
            type="button"
          >
            Clear
          </button>
        </div>
      </header>

      <main className="brainstorm-workspace">
        <section
          className="brainstorm-canvas"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addTextToCanvas(event.dataTransfer.getData("text/plain"), "sidetrack");
          }}
        >
          <Excalidraw
            key={`${activeBoard.id}-${excalidrawTheme}`}
            theme={excalidrawTheme}
            excalidrawAPI={setApi}
            initialData={{
              elements: activeBoard.elements,
              appState: {
                viewBackgroundColor: "transparent",
              },
            }}
            onChange={(elements) => saveScene(elements)}
          />
        </section>

        <aside className="brainstorm-panel">
          <section className="brainstorm-section">
            <h2>Boards</h2>
            <div className="brainstorm-list">
              {boards.map((board) => (
                <button
                  key={board.id}
                  className={`brainstorm-list-item ${board.id === activeBoardId ? "active" : ""}`}
                  onClick={() => setActiveBoardId(board.id)}
                  type="button"
                >
                  <span>{board.title}</span>
                  {boards.length > 1 && (
                    <span
                      className="brainstorm-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteBoard(board.id);
                      }}
                    >
                      x
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="brainstorm-section">
            <h2>Sidetracks</h2>
            <div className="brainstorm-list">
              {idleSidetracks.length ? idleSidetracks.map((idea, index) => (
                <button
                  key={`${idea}-${index}`}
                  className="brainstorm-list-item"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", idea)}
                  onClick={() => addTextToCanvas(idea, "sidetrack")}
                  type="button"
                >
                  <span>{idea}</span>
                </button>
              )) : <p className="brainstorm-empty">No sidetracks captured.</p>}
            </div>
          </section>

          <section className="brainstorm-section">
            <h2>Tasks</h2>
            <div className="brainstorm-list">
              {queue.length ? queue.map((task) => (
                <button
                  key={task.id}
                  className="brainstorm-list-item"
                  onClick={() => addTextToCanvas(task.text, "task")}
                  type="button"
                >
                  <span>{task.text}</span>
                </button>
              )) : <p className="brainstorm-empty">No queued tasks.</p>}
            </div>
          </section>

          <section className="brainstorm-section">
            <h2>Notes</h2>
            <form
              className="brainstorm-form"
              onSubmit={(event) => {
                event.preventDefault();
                const text = noteInput.trim();
                if (!text) return;
                updateActiveBoard({
                  notes: [...activeBoard.notes, { id: createId("note"), text, createdAt: Date.now() }],
                });
                addTextToCanvas(text, "note");
                setNoteInput("");
              }}
            >
              <textarea
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                placeholder="Capture a note"
              />
              <button className="brainstorm-back-btn" type="submit">Add Note</button>
            </form>
            <div className="brainstorm-card-list">
              {activeBoard.notes.map((note) => (
                <div key={note.id} className="brainstorm-card">
                  <p>{note.text}</p>
                  <button
                    className="brainstorm-mini"
                    type="button"
                    onClick={() => updateActiveBoard({
                      notes: activeBoard.notes.filter((item) => item.id !== note.id),
                    })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="brainstorm-section">
            <h2>Board Tasks</h2>
            <form
              className="brainstorm-form row"
              onSubmit={(event) => {
                event.preventDefault();
                const text = taskInput.trim();
                if (!text) return;
                updateActiveBoard({
                  tasks: [...activeBoard.tasks, { id: createId("task"), text, completed: false, createdAt: Date.now() }],
                });
                setTaskInput("");
              }}
            >
              <input
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
                placeholder="Add task"
              />
              <button className="brainstorm-back-btn" type="submit">Add</button>
            </form>
            <div className="brainstorm-card-list">
              {activeBoard.tasks.map((task) => (
                <label key={task.id} className="brainstorm-check-card">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className={task.completed ? "completed" : ""}>{task.text}</span>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};
