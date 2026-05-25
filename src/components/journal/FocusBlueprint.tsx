import React from "react";
import { formatSummaryDuration } from "../../utils/timeFormatters";
import type { Session } from "../../types";

interface FocusBlueprintProps {
  sessionsSnapshot?: Session[];
  idleSidetracksSnapshot?: string[];
  date: string;
}

export const FocusBlueprint: React.FC<FocusBlueprintProps> = ({
  sessionsSnapshot,
  idleSidetracksSnapshot,
  date,
}) => {
  const calculateTotalFocusTime = (sessionsList?: Session[]) => {
    if (!sessionsList) return 0;
    return sessionsList.reduce((acc, s) => acc + (s.duration || 0), 0);
  };

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
          </div>
        )}
      </div>
    </div>
  );
};
