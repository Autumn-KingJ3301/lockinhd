import React from "react";
import { useLockinStore } from "../store/useLockinStore";
import { formatTime, formatPanicTime } from "../utils/timeFormatters";

export const FloatingTimer: React.FC = () => {
  const mode = useLockinStore((state) => state.mode);
  const session = useLockinStore((state) => state.session);
  const elapsed = useLockinStore((state) => state.elapsed);
  const completeSession = useLockinStore((state) => state.completeSession);
  const setShowPanicModal = useLockinStore((state) => state.setShowPanicModal);

  if ((mode !== "active" && mode !== "panic") || !session) return null;

  const isPanic = mode === "panic";
  const isTimer = mode === "active" && session.timerEndElapsed !== undefined;
  const remaining = isPanic 
    ? session.panicEndElapsed! - elapsed 
    : (isTimer ? session.timerEndElapsed! - elapsed : 0);
  const isUrgent = (isPanic || isTimer) && remaining <= 15;
  const isOvertime = (isPanic || isTimer) && remaining < 0;

  // Convert elapsed seconds to clock-hand angles
  const totalSeconds = elapsed;
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600) % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  // SVG clock center and radius
  const cx = 28;
  const cy = 28;
  const r = 22;

  // Compute hand endpoints from center
  const toPoint = (deg: number, len: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(rad) * len, y: cy + Math.sin(rad) * len };
  };

  const hourPt = toPoint(hourDeg, 11);
  const minPt = toPoint(minuteDeg, 15);
  const secPt = toPoint(secondDeg, 19);

  return (
    <div
      className={`floating-timer-box ${isUrgent ? "panic-pulse" : ""} ${isOvertime ? "panic-overtime" : ""}`}
      onClick={() => {
        if (isPanic) setShowPanicModal(true);
      }}
      style={{ cursor: isPanic ? "pointer" : "default" }}
      title={isPanic ? "Click to maximize focus overlay" : undefined}
    >
      {/* Animated SVG Clock */}
      <svg
        className="clock-icon-animated"
        width={56}
        height={56}
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        {/* Clock face */}
        <circle className="clock-face" cx={cx} cy={cy} r={r} />

        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const outer = toPoint(deg, 22);
          const inner = toPoint(deg, 18);
          return (
            <line
              key={deg}
              className="clock-marker"
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
            />
          );
        })}

        {/* Hour hand */}
        <line
          className="clock-hand hour-hand"
          x1={cx} y1={cy}
          x2={hourPt.x} y2={hourPt.y}
        />
        {/* Minute hand */}
        <line
          className="clock-hand minute-hand"
          x1={cx} y1={cy}
          x2={minPt.x} y2={minPt.y}
        />
        {/* Second hand */}
        <line
          className={`clock-hand second-hand ${isPanic ? "panic-hand" : ""}`}
          x1={cx} y1={cy}
          x2={secPt.x} y2={secPt.y}
        />
        {/* Center dot */}
        <circle className="clock-center" cx={cx} cy={cy} r={2.5} />
      </svg>

      {/* Info: task + digital time */}
      <div className="floating-timer-info">
        <div className="floating-timer-task" title={session.task}>
          {session.task}
        </div>
        <div
          className="floating-timer-digital"
          style={(isPanic || isTimer) ? { color: "var(--color-panic)", fontWeight: "bold" } : {}}
        >
          {(isPanic || isTimer) ? formatPanicTime(remaining) : formatTime(elapsed)}
        </div>
      </div>

      {/* Quick Done button */}
      <button
        className="floating-timer-done-btn"
        onClick={(e) => {
          e.stopPropagation();
          completeSession();
        }}
        title="Complete session"
      >
        ✓ done
      </button>
    </div>
  );
};

