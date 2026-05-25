import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import type { Session } from "../../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface FocusAnalyticsProps {
  selectedDate: string; // YYYY-MM-DD
}

const formatDateLocal = (timestamp: number) => {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ selectedDate }) => {
  const sessions = useLockinStore((s) => s.sessions);
  const archives = useLockinStore((s) => s.archives);

  // Merge history across active sessions and archives
  const getMergedCompletedSessions = (): Session[] => {
    const allSessions: Session[] = [...sessions];
    archives.forEach((arc) => {
      if (arc.sessions) {
        allSessions.push(...arc.sessions);
      }
    });

    const uniqueSessionsMap = new Map<number, Session>();
    allSessions.forEach((s) => {
      const id = s.id || s.startTime;
      if (s.endTime && s.duration && s.duration > 0) {
        if (!uniqueSessionsMap.has(id) || (uniqueSessionsMap.get(id)?.duration || 0) < s.duration) {
          uniqueSessionsMap.set(id, s);
        }
      }
    });

    return Array.from(uniqueSessionsMap.values()).sort((a, b) => a.startTime - b.startTime);
  };

  const completedSessions = getMergedCompletedSessions();

  // ─── 1. Impact Stats Calculations ──────────────────────────────────────────
  // Conquered Goals: total subtasks completed across all focus sessions
  const totalCompletedSubtasks = completedSessions.reduce(
    (acc, s) => acc + (s.todos?.filter((t) => t.completed).length || 0),
    0
  );

  // Deep Focus Blocks: sessions that lasted 40 minutes (2400 seconds) or more
  const DEEP_FOCUS_THRESHOLD = 2400; // 40 minutes
  const deepFocusSessions = completedSessions.filter(
    (s) => s.duration && s.duration >= DEEP_FOCUS_THRESHOLD
  );
  const deepFocusBlocksCount = deepFocusSessions.length;

  // Active Flow Days: Count of unique calendar days on which focus occurred
  const activeDaysSet = new Set<string>();
  completedSessions.forEach((s) => {
    if (s.endTime) {
      activeDaysSet.add(formatDateLocal(s.endTime));
    }
  });
  const activeFlowDaysCount = activeDaysSet.size;

  // ─── 2. Flow Formula Algorithm (Success Replication) ────────────────────────
  // We define a high-performance session as one lasting >= 40m OR one that completed >= 2 subtasks
  const peakSessions = completedSessions.filter(
    (s) =>
      (s.duration && s.duration >= DEEP_FOCUS_THRESHOLD) ||
      (s.todos && s.todos.filter((t) => t.completed).length >= 2)
  );

  const getFlowFormula = () => {
    const targetSessions = peakSessions.length > 0 ? peakSessions : completedSessions;
    if (targetSessions.length === 0) {
      return {
        peakWindow: "N/A",
        dominantTopic: "N/A",
        recipe: "Log focus sessions and complete subtasks to generate your flow recipe.",
      };
    }

    // A. Calculate Peak Time Window
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let nightCount = 0;

    targetSessions.forEach((s) => {
      const hour = new Date(s.startTime).getHours();
      if (hour >= 5 && hour < 12) morningCount++;
      else if (hour >= 12 && hour < 17) afternoonCount++;
      else if (hour >= 17 && hour < 22) eveningCount++;
      else nightCount++;
    });

    let peakWindow = "Mornings (5:00 AM - 12:00 PM)";
    let maxCount = morningCount;
    if (afternoonCount > maxCount) {
      peakWindow = "Afternoons (12:00 PM - 5:00 PM)";
      maxCount = afternoonCount;
    }
    if (eveningCount > maxCount) {
      peakWindow = "Evenings (5:00 PM - 10:00 PM)";
      maxCount = eveningCount;
    }
    if (nightCount > maxCount) {
      peakWindow = "Late Nights (10:00 PM - 5:00 AM)";
      maxCount = nightCount;
    }

    // B. Calculate Dominant Topic by total duration in peak sessions
    const topicDurations: Record<string, number> = {};
    targetSessions.forEach((s) => {
      const topic = s.task.trim();
      topicDurations[topic] = (topicDurations[topic] || 0) + (s.duration || 0);
    });

    let dominantTopic = "N/A";
    let maxDuration = 0;
    Object.entries(topicDurations).forEach(([topic, dur]) => {
      if (dur > maxDuration) {
        dominantTopic = topic;
        maxDuration = dur;
      }
    });

    // C. Draft Recipe
    const recipeText = `When you focus on "${dominantTopic}" during the ${peakWindow.split(" ")[0].toLowerCase()} window, you trigger your deepest flow. Replicate this success by blocking out a 45-minute session for "${dominantTopic}" in that period, pre-defining your subtasks.`;

    return {
      peakWindow,
      dominantTopic,
      recipe: recipeText,
    };
  };

  const flowFormula = getFlowFormula();

  // ─── 3. The Wall of Wins Timeline (Excluding Absent Days) ───────────────────
  interface DailyWin {
    dateStr: string;
    formattedDate: string;
    topics: string[];
    achievements: string[];
    notes: string[];
  }

  const getWallOfWins = (): DailyWin[] => {
    const dailyMap = new Map<string, { timestamp: number; sessions: Session[] }>();

    completedSessions.forEach((s) => {
      if (s.endTime) {
        const dateStr = formatDateLocal(s.endTime);
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { timestamp: s.endTime, sessions: [] });
        }
        dailyMap.get(dateStr)!.sessions.push(s);
      }
    });

    const wins: DailyWin[] = [];
    dailyMap.forEach((data, dateStr) => {
      const formattedDate = new Date(data.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      const topics = Array.from(new Set(data.sessions.map((s) => s.task.trim())));
      const achievements: string[] = [];
      const notes: string[] = [];

      data.sessions.forEach((s) => {
        if (s.todos) {
          s.todos
            .filter((t) => t.completed)
            .forEach((t) => achievements.push(t.text));
        }
        if (s.notes) {
          s.notes.forEach((n) => notes.push(n.text));
        }
      });

      wins.push({
        dateStr,
        formattedDate,
        topics,
        achievements,
        notes,
      });
    });

    // Return in reverse chronological order (latest days with wins first)
    return wins.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  };

  const wallOfWins = getWallOfWins();

  // ─── 4. Selected Date Stats ──────────────────────────────────────────────────
  const selectedDateSessions = completedSessions.filter(
    (s) => s.endTime && formatDateLocal(s.endTime) === selectedDate
  );
  const dailyFocusSeconds = selectedDateSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const dailyFocusMinutes = Math.round(dailyFocusSeconds / 60);

  const dailyTodos = selectedDateSessions.reduce((acc: any[], s) => [...acc, ...(s.todos || [])], []);
  const dailyTodosCompleted = dailyTodos.filter((t) => t.completed).length;

  const dailySidetracksCount = selectedDateSessions.reduce(
    (acc, s) => acc + (s.sidetracks?.length || 0),
    0
  );

  const dailyGoalSeconds = 4 * 3600; // 4 Hours target
  const progressPercentage = Math.min(100, Math.round((dailyFocusSeconds / dailyGoalSeconds) * 100));
  const circleRadius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // ─── 5. Recharts: Focus Momentum (Active Days Only) ──────────────────────────
  const getMomentumData = () => {
    // Map dates chronologically (oldest to newest)
    const dates = Array.from(activeDaysSet).sort((a, b) => a.localeCompare(b));
    return dates.map((dateStr) => {
      const daySessions = completedSessions.filter(
        (s) => s.endTime && formatDateLocal(s.endTime) === dateStr
      );
      const minutes = Math.round(
        daySessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
      );
      const subtasks = daySessions.reduce(
        (acc, s) => acc + (s.todos?.filter((t) => t.completed).length || 0),
        0
      );

      const d = new Date(dateStr + "T00:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        dateLabel: label,
        "Focus Minutes": minutes,
        "Completed Tasks": subtasks,
      };
    });
  };

  const momentumData = getMomentumData();

  // ─── 6. Recharts: Estimation Accuracy Donut ─────────────────────────────────
  const getEstimationAccuracyData = () => {
    const estimatedSessions = completedSessions.filter(
      (s) => s.estimatedDuration && s.estimatedDuration > 0
    );
    let overestimated = 0;
    let accurate = 0;
    let underestimated = 0;

    estimatedSessions.forEach((s) => {
      const estimated = s.estimatedDuration || 0;
      const actual = s.duration || 0;
      const diffPercent = (actual - estimated) / estimated;

      if (diffPercent > 0.15) {
        underestimated++;
      } else if (diffPercent < -0.15) {
        overestimated++;
      } else {
        accurate++;
      }
    });

    return [
      { name: "Overestimated (Finished Early)", value: overestimated, color: "var(--color-success)" },
      { name: "Accurate (Within ±15%)", value: accurate, color: "var(--color-accent)" },
      { name: "Underestimated (Overtime)", value: underestimated, color: "var(--color-panic)" },
    ].filter((d) => d.value > 0);
  };

  const estimationAccuracyData = getEstimationAccuracyData();

  return (
    <div className="analytics-dashboard">
      <style>{`
        .analytics-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: var(--color-text);
        }

        .analytics-grid-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .analytics-card {
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: var(--theme-border-radius, 10px);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }

        .analytics-card-title {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-muted);
          text-transform: uppercase;
        }

        /* Summary counters strip */
        .stats-summary-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }

        .stat-strip-box {
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }

        .stat-strip-val {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .stat-strip-lbl {
          font-size: 9.5px;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Flow Formula Replication Box */
        .flow-formula-card {
          background: linear-gradient(135deg, var(--color-accent-bg), rgba(255,255,255,0.02));
          border-color: var(--color-accent-border);
        }

        .flow-formula-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--color-accent);
          font-size: 13px;
        }

        .flow-formula-body {
          font-size: 13.5px;
          line-height: 1.6;
          opacity: 0.9;
        }

        .flow-formula-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .flow-formula-pill {
          background-color: var(--color-card-bg);
          border: 0.5px solid var(--color-border);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 10.5px;
          font-family: var(--font-mono);
          font-weight: 600;
        }

        /* Wall of Wins Feed */
        .wall-of-wins-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .win-day-node {
          border-left: 2px solid var(--color-accent);
          padding-left: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .win-day-node::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-card-bg);
          border: 2px solid var(--color-accent);
        }

        .win-day-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text);
        }

        .win-day-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .win-topic-badge {
          background-color: var(--color-surface);
          border: 0.5px solid var(--color-border);
          color: var(--color-muted);
          font-size: 9.5px;
          padding: 1.5px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .win-achievements-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 2px;
        }

        .win-achievement-item {
          font-size: 12px;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .win-check {
          color: var(--color-success);
          font-weight: bold;
        }

        .win-day-empty-hint {
          font-size: 11px;
          color: var(--color-muted);
          font-style: italic;
        }

        /* Circular progress ring */
        .ring-content-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 16px;
          padding: 8px 0;
        }

        .ring-graphics-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
        }

        .ring-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .ring-bg {
          fill: none;
          stroke: var(--color-border);
          opacity: 0.3;
        }

        .ring-progress {
          fill: none;
          stroke: var(--color-accent);
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s ease;
        }

        .ring-center-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ring-center-val {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
        }

        .ring-center-pct {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--color-muted);
        }

        .ring-details-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-grow: 1;
        }

        .ring-detail-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 0.5px solid var(--color-border);
          padding-bottom: 4px;
          font-size: 12px;
        }

        .ring-detail-item-val {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--color-accent);
        }

        /* Chart Wrappers */
        .chart-wrapper {
          height: 200px;
          width: 100%;
          margin-top: 8px;
        }

        .chart-tooltip {
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 6px;
          padding: 8px 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-size: 11px;
        }

        .chart-tooltip-title {
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .chart-tooltip-value {
          color: var(--color-accent);
          font-family: var(--font-mono);
        }
      `}</style>

      {/* ─── ROW 1: Summary Strip (Wins and Days present) ──────────────────────── */}
      <div className="stats-summary-strip">
        <div className="stat-strip-box">
          <span className="stat-strip-val">{totalCompletedSubtasks}</span>
          <span className="stat-strip-lbl">Conquered Goals</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">{deepFocusBlocksCount}</span>
          <span className="stat-strip-lbl">Deep Focus Blocks</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">{activeFlowDaysCount}</span>
          <span className="stat-strip-lbl">Active Flow Days</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">
            {completedSessions.length > 0
              ? `${Math.round((deepFocusBlocksCount / completedSessions.length) * 100)}%`
              : "0%"}
          </span>
          <span className="stat-strip-lbl">Deep Work Ratio</span>
        </div>
      </div>

      {/* ─── ROW 2: Focus Flow replication Formula ─────────────────────────────── */}
      <div className="analytics-card flow-formula-card">
        <div className="flow-formula-header">
          <span>✦ FLOW STATE FORMULA</span>
        </div>
        <div className="flow-formula-body">{flowFormula.recipe}</div>
        <div className="flow-formula-pill-row">
          <div className="flow-formula-pill">🎯 Top Subject: {flowFormula.dominantTopic}</div>
          <div className="flow-formula-pill">⏰ Best Hour: {flowFormula.peakWindow}</div>
          <div className="flow-formula-pill">⚡ Minimum Flow Depth: 40 mins</div>
        </div>
      </div>

      {/* ─── ROW 3: Wall of Wins & Daily metrics circle ────────────────────────── */}
      <div className="analytics-grid-row">
        {/* Wall of Wins: timeline showing ONLY days present and did great */}
        <div className="analytics-card">
          <div className="analytics-card-title">Wall of Wins (Timeline)</div>
          <div className="wall-of-wins-feed">
            {wallOfWins.length === 0 ? (
              <div className="hint-text" style={{ padding: "40px 0", textAlign: "center" }}>
                No achievements recorded yet. Finish focus sessions and mark tasks complete to populate your wall of wins!
              </div>
            ) : (
              wallOfWins.map((win, idx) => (
                <div key={idx} className="win-day-node">
                  <span className="win-day-title">{win.formattedDate}</span>
                  <div className="win-day-topics">
                    {win.topics.map((t, i) => (
                      <span key={i} className="win-topic-badge">
                        📁 {t}
                      </span>
                    ))}
                  </div>

                  {win.achievements.length > 0 ? (
                    <div className="win-achievements-list">
                      {win.achievements.map((ach, i) => (
                        <div key={i} className="win-achievement-item">
                          <span className="win-check">✓</span>
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="win-day-empty-hint">
                      Conquered focus blocks on topics without specific subtask checklists.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Date Insight progress circle */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            Daily Output —{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="ring-content-row">
            <div className="ring-graphics-wrapper">
              <svg className="ring-svg">
                <circle className="ring-bg" cx="70" cy="70" r={circleRadius} strokeWidth={strokeWidth} />
                <circle
                  className="ring-progress"
                  cx="70"
                  cy="70"
                  r={circleRadius}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="ring-center-label">
                <span className="ring-center-val">
                  {dailyFocusMinutes >= 60
                    ? `${Math.floor(dailyFocusMinutes / 60)}h ${dailyFocusMinutes % 60}m`
                    : `${dailyFocusMinutes} min`}
                </span>
                <span className="ring-center-pct">{progressPercentage}% goal</span>
              </div>
            </div>

            <div className="ring-details-panel">
              <div className="ring-detail-item">
                <span>Completed Tasks</span>
                <span className="ring-detail-item-val">{selectedDateSessions.length}</span>
              </div>
              <div className="ring-detail-item">
                <span>Todos Checkoff</span>
                <span className="ring-detail-item-val">
                  {dailyTodosCompleted}/{dailyTodos.length}
                </span>
              </div>
              <div className="ring-detail-item">
                <span>Distractions</span>
                <span className="ring-detail-item-val">{dailySidetracksCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: Recharts Visualizations (Active Days Only) ─────────────────── */}
      <div className="analytics-grid-row">
        {/* Momentum: plot focus minutes & subtask outputs over active days only */}
        <div className="analytics-card">
          <div className="analytics-card-title">Focus Momentum & Output</div>
          <div className="chart-wrapper">
            {momentumData.length === 0 ? (
              <div className="hint-text" style={{ padding: "60px 0", textAlign: "center" }}>
                No focus logs to determine momentum.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={momentumData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: "var(--color-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "var(--color-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "var(--color-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="chart-tooltip">
                            <div className="chart-tooltip-title">{payload[0].payload.dateLabel}</div>
                            <div className="chart-tooltip-value">
                              Focus: {payload[0].value} minutes
                            </div>
                            <div className="chart-tooltip-value" style={{ color: "var(--color-success)" }}>
                              Conquered Goals: {payload[1].value}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "var(--font-sans)", color: "var(--color-muted)" }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Focus Minutes"
                    name="Focus Minutes"
                    fill="var(--color-accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Completed Tasks"
                    name="Conquered Goals"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-success)", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Estimation Accuracy (Donut Chart) */}
        <div className="analytics-card">
          <div className="analytics-card-title">Estimation Target Accuracy</div>
          <div className="chart-wrapper">
            {completedSessions.filter((s) => s.estimatedDuration && s.estimatedDuration > 0).length === 0 ? (
              <div className="hint-text" style={{ padding: "60px 0", textAlign: "center" }}>
                Add session estimates when locking-in to calculate accuracy.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estimationAccuracyData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {estimationAccuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="chart-tooltip">
                            <div className="chart-tooltip-title" style={{ color: payload[0].payload.color }}>
                              {payload[0].name}
                            </div>
                            <div className="chart-tooltip-value">
                              Count: {payload[0].value} {payload[0].value === 1 ? "session" : "sessions"}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 9, fontFamily: "var(--font-sans)", color: "var(--color-muted)", bottom: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
