import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Excalidraw,
  convertToExcalidrawElements,
  exportToBlob,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useLockinStore } from "../store/useLockinStore";
import { CommandBar } from "../components/CommandBar";
import "./Brainstorm.css";

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

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

const getThemeColor = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export const Brainstorm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isReviewMode = queryParams.get("review") === "true";
  const reviewBoardId = queryParams.get("boardId");

  const appTheme = useLockinStore((state) => state.theme);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const queue = useLockinStore((state) => state.queue);
  const boards = useLockinStore((state) => state.boards);
  const archives = useLockinStore((state) => state.archives);
  const activeBoardId = useLockinStore((state) => state.activeBoardId);
  const createBoard = useLockinStore((state) => state.createBoard);
  const updateBoard = useLockinStore((state) => state.updateBoard);
  const setActiveBoardId = useLockinStore((state) => state.setActiveBoardId);
  const toggleBrainstormTask = useLockinStore((state) => state.toggleBrainstormTask);
  const addBrainstormNote = useLockinStore((state) => state.addBrainstormNote);
  const addBrainstormTask = useLockinStore((state) => state.addBrainstormTask);
  const toastMsg = useLockinStore((state) => state.toastMsg);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);

  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  
  const [api, setApi] = useState<any>(null);
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
    if (isReviewMode) return; // Don't auto-create or switch in review mode

    if (boards.length === 0) {
      createBoard("Brainstorm Board");
    } else if (!activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId, createBoard, setActiveBoardId, isReviewMode]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => {
        setToastMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg, setToastMsg]);

  const excalidrawTheme =
    appTheme === "system" ? (systemPrefersDark ? "dark" : "light") : appTheme;
  
  let activeBoard = boards.find((board) => board.id === (isReviewMode ? reviewBoardId : activeBoardId)) || boards[0];

  if (isReviewMode && reviewBoardId && !boards.find(b => b.id === reviewBoardId)) {
    for (const archive of archives) {
      const found = archive.boards?.find(b => b.id === reviewBoardId);
      if (found) {
        activeBoard = found;
        break;
      }
    }
  }

  if (!activeBoard) return null;

  const saveScene = (elements: readonly any[]) => {
    if (isReviewMode) return; // Disable saving in review mode

    const sanitizedElements = sanitizeElements(elements);
    const signature = getSceneSignature(sanitizedElements);
    if (sceneSignatureRef.current[activeBoard.id] === signature) return;

    sceneSignatureRef.current[activeBoard.id] = signature;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      updateBoard(activeBoard.id, { elements: sanitizedElements });
    }, 250);
  };

  const addElements = (nextElements: any[]) => {
    if (!api || isReviewMode) return;
    const mergedElements = [...api.getSceneElements(), ...nextElements];
    api.updateScene({ elements: mergedElements });
    updateBoard(activeBoard.id, { elements: sanitizeElements(mergedElements) });
  };

  const takeBoardSnapshot = async () => {
    if (!api || !activeBoard) return;
    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: {
          ...api.getAppState(),
          exportBackground: true,
        },
        files: api.getFiles(),
        mimeType: "image/png",
        exportPadding: 20,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const journals = useLockinStore.getState().journals;
        const todayStr = new Date().toISOString().split("T")[0];
        const todayJournal = journals.find(j => j.date === todayStr);

        if (todayJournal) {
          const snapshots = todayJournal.boardSnapshots || [];
          // Keep only one snapshot per board per day to avoid bloat, or append if you prefer
          const filtered = snapshots.filter(s => s.boardId !== activeBoard.id);
          const updatedSnapshots = [
            ...filtered,
            { boardId: activeBoard.id, boardTitle: activeBoard.title, pngBase64: base64 }
          ];
          useLockinStore.getState().saveJournalEntry({
            ...todayJournal,
            boardSnapshots: updatedSnapshots
          });
          useLockinStore.getState().setToastMsg("Visual snapshot saved to today's journal! 📸");
        } else {
           useLockinStore.getState().setToastMsg("Please open the Journal once to initialize today's entry.");
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to take board snapshot:", e);
    }
  };

  const addTextToCanvas = (text: string, source: "note" | "sidetrack" | "task" = "note") => {
    if (!api || !text.trim() || isReviewMode) return;
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
      addBrainstormNote(activeBoard.id, text, elementId);
    }
  };

  const handleCreateNewBoard = () => {
    createBoard(`Brainstorm ${boards.length + 1}`);
  };

  return (
    <div className="brainstorm-page">
      {toastMsg && (
        <div className="toast-notification" onClick={() => setToastMsg(null)} title="Click to dismiss">
          {toastMsg}
        </div>
      )}
      <header className="brainstorm-header">
        <button className="brainstorm-back-btn" onClick={() => navigate("/")} type="button">
          {isReviewMode ? "Back to History" : "Back"}
        </button>
        <div className="brainstorm-heading">
          <span className="brainstorm-agenda-prefix">Agenda:</span>
          {isReviewMode ? (
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>{activeBoard.title}</span>
          ) : (
            <input
              className="brainstorm-title-input"
              value={activeBoard?.title || "Brainstorm"}
              onChange={(event) => updateBoard(activeBoard.id, { title: event.target.value })}
            />
          )}
          {isReviewMode && <span className="badge" style={{ marginLeft: "8px", fontSize: "10px" }}>Read Only</span>}
        </div>
        {!isReviewMode && (
          <div className="brainstorm-actions">
            <button className="brainstorm-back-btn" onClick={takeBoardSnapshot} type="button" title="Capture canvas snapshot to today's journal">
              Snapshot
            </button>
            <button className="brainstorm-back-btn" onClick={handleCreateNewBoard} type="button">
              New
            </button>
            <button
              className="brainstorm-back-btn"
              onClick={() => updateBoard(activeBoard.id, { elements: [] })}
              type="button"
            >
              Clear
            </button>
          </div>
        )}
      </header>

      <main className="brainstorm-workspace">
        <section
          className="brainstorm-canvas"
          onDragOver={(event) => !isReviewMode && event.preventDefault()}
          onDrop={(event) => {
            if (isReviewMode) return;
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
                zenModeEnabled: isReviewMode,
              },
            }}
            onChange={(elements) => saveScene(elements)}
            viewModeEnabled={isReviewMode}
          />
        </section>

        {!isReviewMode && (
          <aside className="brainstorm-panel">
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
              <h2>Board Tasks</h2>
              <form
                className="brainstorm-form row"
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = taskInput.trim();
                  if (!text) return;
                  addBrainstormTask(activeBoard.id, text);
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
                {(activeBoard.tasks || []).map((task) => (
                  <label key={task.id} className="brainstorm-check-card">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleBrainstormTask(activeBoard.id, task.id)}
                    />
                    <span className={task.completed ? "completed" : ""}>{task.text}</span>
                  </label>
                ))}
              </div>
            </section>
          </aside>
        )}
      </main>
      {!isReviewMode && <CommandBar compact />}
    </div>
  );
};
