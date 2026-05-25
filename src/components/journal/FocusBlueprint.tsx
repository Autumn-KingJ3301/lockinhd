import { formatSummaryDuration } from "../../utils/timeFormatters";
import type { Session, BrainstormBoard, WindDownLog } from "../../types";

interface FocusBlueprintProps {
  sessionsSnapshot?: Session[];
  idleSidetracksSnapshot?: string[];
  windDownSnapshot?: WindDownLog[];
  boardSnapshots?: { boardId: string, boardTitle: string, pngBase64: string }[];
  allBoards?: BrainstormBoard[];
  date: string;
}

export const FocusBlueprint: React.FC<FocusBlueprintProps> = ({
  sessionsSnapshot,
  idleSidetracksSnapshot,
  windDownSnapshot,
  boardSnapshots,
  allBoards,
  date,
}) => {
  const calculateTotalFocusTime = (sessionsList?: Session[]) => {
    if (!sessionsList) return 0;
    return sessionsList.reduce((acc, s) => acc + (s.duration || 0), 0);
  };

  const selectedDateMidnight = new Date(date + "T00:00:00").getTime();
  const nextDateMidnight = selectedDateMidnight + 24 * 3600 * 1000;

  // Flatten board activities (notes, tasks, agenda) for the unified timeline
  const getBoardActivity = () => {
    const activity: { type: "board-note" | "board-task" | "board-agenda", text: string, ts: number, boardTitle: string }[] = [];
    
    (allBoards || []).forEach(board => {
      // Notes
      (board.notes || []).forEach(n => {
        if (n.createdAt >= selectedDateMidnight && n.createdAt < nextDateMidnight) {
          activity.push({ type: "board-note", text: n.text, ts: n.createdAt, boardTitle: board.title });
        }
      });
      // Tasks
      (board.tasks || []).forEach(t => {
        if (t.createdAt >= selectedDateMidnight && t.createdAt < nextDateMidnight) {
          activity.push({ type: "board-task", text: t.text, ts: t.createdAt, boardTitle: board.title });
        }
      });
      // Agenda
      (board.agenda || []).forEach(a => {
        if (a.createdAt >= selectedDateMidnight && a.createdAt < nextDateMidnight) {
          activity.push({ type: "board-agenda", text: a.text, ts: a.createdAt, boardTitle: board.title });
        }
      });
    });

    return activity.sort((a, b) => a.ts - b.ts);
  };

  const boardActivity = getBoardActivity();

  return (
    <div className="focus-blueprint-section">
      <div className="focus-blueprint-header">
        ✦ MY FOCUS BLUEPRINT — {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </div>

      <div className="snapshot-narrative-box">
        <p>
          On this day, I dedicated <strong>
            {(() => {
              const totalSeconds = calculateTotalFocusTime(sessionsSnapshot);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              if (hours === 0 && minutes === 0) return "less than a minute";
              const hourPart = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
              const minutePart = minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";
              if (hourPart && minutePart) return `${hourPart} and ${minutePart}`;
              return hourPart || minutePart;
            })()}
          </strong> of deep focus toward my objectives. I completed <strong>{sessionsSnapshot?.length || 0}</strong> focus blocks, checked off <strong>{sessionsSnapshot?.reduce((acc, s) => acc + (s.todos?.filter(t => t.completed).length || 0), 0) || 0}</strong> subtasks, and captured <strong>{(sessionsSnapshot?.reduce((acc, s) => acc + (s.sidetracks?.length || 0), 0) || 0) + (idleSidetracksSnapshot?.length || 0)}</strong> ideas along the way.
        </p>
      </div>

      {/* Board Visual Highlights */}
      {boardSnapshots && boardSnapshots.length > 0 && (
        <div style={{ padding: "16px", borderBottom: "1px dashed var(--color-border)" }}>
           <div className="task-label" style={{ marginBottom: "12px" }}>Visual Canvas Milestones</div>
           <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
             {boardSnapshots.map((snap, i) => (
               <div key={i} style={{ flexShrink: 0, width: "240px" }}>
                 <div style={{ 
                   height: "140px", 
                   borderRadius: "6px", 
                   overflow: "hidden", 
                   border: "1px solid var(--color-border)",
                   backgroundColor: "#fff" // Excalidraw default bg
                 }}>
                   <img src={snap.pngBase64} alt={snap.boardTitle} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                 </div>
                 <div style={{ fontSize: "10px", marginTop: "4px", color: "var(--color-muted)", textAlign: "center" }}>
                   Board: <strong>{snap.boardTitle}</strong>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="snapshot-details-list">
        {!sessionsSnapshot || sessionsSnapshot.length === 0 ? (
          <div className="hint-text" style={{ padding: "8px 0", textAlign: "center" }}>
            No focus logs recorded for this day. Click "Refresh Snapshot" to capture current workspace progress.
          </div>
        ) : (
          <div className="artifact-timeline">
            {sessionsSnapshot.map((s, idx) => (
              <div key={idx} className="artifact-node">
                <div className="artifact-line"></div>
                <div className="artifact-dot">{idx + 1}</div>
                <div className="artifact-node-content">
                  <div className="artifact-node-header">
                    <span className="artifact-node-title">{s.task}</span>
                    {s.endTime ? (
                      <span className="artifact-node-duration">
                        · {formatSummaryDuration(s.duration || 0)} spent
                      </span>
                    ) : (
                      <span className="artifact-node-duration active-pulsing">
                        · {formatSummaryDuration(s.duration || 0)} spent (Active Session)
                      </span>
                    )}
                  </div>
                  
                  {/* Notes Feed */}
                  {s.notes && s.notes.length > 0 && (
                    <div className="artifact-notes-container">
                      {s.notes.map((n, i) => (
                        <div key={i} className="artifact-note-bubble">
                          “ {n.text} ”
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Checklists */}
                  {s.todos && s.todos.length > 0 && (
                    <div className="artifact-tags-container">
                      {s.todos.map((todo, i) => (
                        <span key={i} className={`artifact-todo-tag ${todo.completed ? "completed" : "pending"}`}>
                          {todo.completed ? "✓" : "○"} {todo.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Sidetracks */}
                  {s.sidetracks && s.sidetracks.length > 0 && (
                    <div className="artifact-tags-container">
                      {s.sidetracks.map((st, i) => (
                        <span key={i} className="artifact-sidetrack-badge">
                          💡 {st}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Combined Board Activity */}
            {boardActivity.length > 0 && (
              <div className="artifact-node">
                <div className="artifact-line"></div>
                <div className="artifact-dot" style={{ background: "var(--color-accent-bg)", color: "var(--color-accent)" }}>🎨</div>
                <div className="artifact-node-content">
                  <div className="artifact-node-header">
                    <span className="artifact-node-title">Infinite Canvas Developments</span>
                  </div>
                  <div className="artifact-tags-container" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                    {boardActivity.map((act, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                        <span style={{ fontSize: "10px", opacity: 0.6, whiteSpace: "nowrap" }}>
                          {new Date(act.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="artifact-sidetrack-badge" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                          {act.type === "board-task" ? "☑" : act.type === "board-note" ? "📝" : "✦"} {act.text}
                          <span style={{ fontSize: "9px", opacity: 0.5, marginLeft: "4px" }}>— {act.boardTitle}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {idleSidetracksSnapshot && idleSidetracksSnapshot.length > 0 && (
              <div className="artifact-node" style={{ opacity: 0.85 }}>
                <div className="artifact-dot" style={{ borderColor: "var(--color-muted)", color: "var(--color-muted)" }}>💡</div>
                <div className="artifact-node-content">
                  <div className="artifact-node-header">
                    <span className="artifact-node-title" style={{ color: "var(--color-muted)" }}>
                      Braindump & Inbox Discoveries
                    </span>
                  </div>
                  <div className="artifact-tags-container">
                    {idleSidetracksSnapshot.map((st, i) => (
                      <span key={i} className="artifact-sidetrack-badge" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        💡 {st}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {windDownSnapshot && windDownSnapshot.length > 0 && (
              <div className="artifact-node" style={{ opacity: 0.9 }}>
                <div className="artifact-line"></div>
                <div className="artifact-dot" style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)", background: "var(--color-accent-bg)" }}>🍃</div>
                <div className="artifact-node-content">
                  <div className="artifact-node-header">
                    <span className="artifact-node-title" style={{ color: "var(--color-accent)" }}>
                      Recovery & Wind Down Sessions
                    </span>
                  </div>
                  <div className="artifact-tags-container" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                    {windDownSnapshot.map((wd, i) => {
                      const moodList = ["😫", "😐", "🙂", "😌", "🧘"];
                      const beforeEmoji = wd.moodRatingBefore ? moodList[wd.moodRatingBefore - 1] : "";
                      const afterEmoji = wd.moodRatingAfter ? moodList[wd.moodRatingAfter - 1] : "";
                      return (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                          <span style={{ fontSize: "10px", opacity: 0.6, whiteSpace: "nowrap" }}>
                            {new Date(wd.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="artifact-sidetrack-badge" style={{ backgroundColor: "var(--color-accent-bg)", borderColor: "var(--color-accent-border)" }}>
                            🧘 {wd.activityName || "Quiet Resting"}
                            <span style={{ marginLeft: "6px", opacity: 0.8 }}>· {formatSummaryDuration(wd.duration)}</span>
                            {(beforeEmoji || afterEmoji) && (
                              <span style={{ marginLeft: "8px", filter: "none" }}>
                                Mood: {beforeEmoji ? `${beforeEmoji} → ` : ""}{afterEmoji}
                              </span>
                            )}
                            {wd.associatedSessionTask && (
                              <span style={{ fontSize: "9.5px", opacity: 0.5, marginLeft: "4px" }}>
                                (wound down from: {wd.associatedSessionTask})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
