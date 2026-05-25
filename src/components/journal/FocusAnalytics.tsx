import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import type { Session, Archive } from "../../types";
import { formatSummaryDuration } from "../../utils/timeFormatters";
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

// Local helper to format Date to YYYY-MM-DD in local timezone
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

  // Merge sessions from active history + archives for complete self-analytics
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

  // ─── 1. Aggregated Metrics ───────────────────────────────────────────────────
  const totalFocusSeconds = completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = totalFocusSeconds / 3600;
  
  const avgSessionSeconds = completedSessions.length > 0 ? totalFocusSeconds / completedSessions.length : 0;

  const totalTodosCount = completedSessions.reduce((acc, s) => acc + (s.todos?.length || 0), 0);
  const completedTodosCount = completedSessions.reduce(
    (acc, s) => acc + (s.todos?.filter((t) => t.completed).length || 0),
    0
  );
  const subtaskSuccessRate = totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0;

  const totalSidetracksCount = completedSessions.reduce(
    (acc, s) => acc + (s.sidetracks?.length || 0),
    0
  );
  const sidetracksPerHour = totalHours > 0 ? parseFloat((totalSidetracksCount / totalHours).toFixed(2)) : 0;

  // ─── 2. Heatmap Construction (Last 12 Weeks) ──────────────────────────────────
  const getHeatmapDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    const startDate = new Date(today);
    // Backtrack to Sunday 11 weeks ago to render a perfect 12-week grid
    startDate.setDate(today.getDate() - (11 * 7 + currentDayOfWeek));
    startDate.setHours(0, 0, 0, 0);

    const days: { dateStr: string; label: string; totalDuration: number }[] = [];
    for (let i = 0; i < 84; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = formatDateLocal(d.getTime());
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
      days.push({ dateStr, label, totalDuration: 0 });
    }

    completedSessions.forEach((s) => {
      if (s.endTime) {
        const sDateStr = formatDateLocal(s.endTime);
        const match = days.find((x) => x.dateStr === sDateStr);
        if (match) {
          match.totalDuration += s.duration || 0;
        }
      }
    });

    return days;
  };

  const heatmapDays = getHeatmapDays();

  // Heatmap helper for cell transparency mapping focus hours
  const getHeatmapOpacity = (seconds: number) => {
    if (seconds === 0) return 0.06;
    const hours = seconds / 3600;
    if (hours < 0.5) return 0.25;
    if (hours < 1.5) return 0.5;
    if (hours < 3) return 0.75;
    return 1.0;
  };

  // ─── 3. Selected Date Daily Statistics ───────────────────────────────────────
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

  // SVG Radial Progress Calculations
  const dailyGoalSeconds = 4 * 3600; // 4 Hours default daily focus target
  const progressPercentage = Math.min(100, Math.round((dailyFocusSeconds / dailyGoalSeconds) * 100));
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // ─── 4. Recharts: Energy vs Focus Duration & Sidetracks ──────────────────────
  const getEnergyData = () => {
    return [1, 2, 3, 4, 5].map((rating) => {
      const group = completedSessions.filter((s) => s.energyRating === rating);
      const avgDuration =
        group.length > 0
          ? Math.round(group.reduce((acc, s) => acc + (s.duration || 0), 0) / group.length / 60)
          : 0;
      const avgSidetracks =
        group.length > 0
          ? parseFloat(
              (group.reduce((acc, s) => acc + (s.sidetracks?.length || 0), 0) / group.length).toFixed(1)
            )
          : 0;
      return {
        energy: `Rating ${rating}`,
        duration: avgDuration,
        sidetracks: avgSidetracks,
      };
    });
  };

  const energyData = getEnergyData();

  // ─── 5. Recharts: Estimation Accuracy Donut ─────────────────────────────────
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
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .analytics-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.05);
        }

        .analytics-card-title {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-muted);
          text-transform: uppercase;
        }

        /* Stats Row */
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

        /* Heatmap styling */
        .heatmap-widget-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .heatmap-grid {
          display: grid;
          grid-auto-flow: column;
          grid-template-rows: repeat(7, 1fr);
          grid-template-columns: repeat(12, 1fr);
          gap: 5px;
          margin-top: 8px;
          align-self: center;
        }

        .heatmap-cell {
          width: 14px;
          height: 14px;
          border-radius: 2px;
          background-color: var(--color-accent);
          transition: transform 0.15s, filter 0.15s;
          cursor: pointer;
          position: relative;
        }

        .heatmap-cell:hover {
          transform: scale(1.2);
          z-index: 10;
          filter: brightness(1.2);
        }

        .heatmap-labels-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--color-muted);
          padding: 0 4px;
        }

        .heatmap-legend {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          color: var(--color-muted);
          margin-top: 4px;
        }

        .legend-block {
          width: 10px;
          height: 10px;
          border-radius: 1.5px;
          background-color: var(--color-accent);
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

      {/* ─── ROW 1: Counters and Overview ──────────────────────────────────────── */}
      <div className="stats-summary-strip">
        <div className="stat-strip-box">
          <span className="stat-strip-val">
            {totalHours >= 1 ? `${totalHours.toFixed(1)}h` : formatSummaryDuration(totalFocusSeconds)}
          </span>
          <span className="stat-strip-lbl">Total Focus</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">
            {formatSummaryDuration(avgSessionSeconds)}
          </span>
          <span className="stat-strip-lbl">Avg Duration</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">{subtaskSuccessRate}%</span>
          <span className="stat-strip-lbl">Todos Done</span>
        </div>
        <div className="stat-strip-box">
          <span className="stat-strip-val">{sidetracksPerHour}</span>
          <span className="stat-strip-lbl">Sidetracks/h</span>
        </div>
      </div>

      {/* ─── ROW 2: Activity Heatmap & Selected Date Ring ───────────────────────── */}
      <div className="analytics-grid-row">
        {/* Playful Theme-Styled Activity Heatmap */}
        <div className="analytics-card">
          <div className="analytics-card-title">Focus Activity Heatmap</div>
          <div className="heatmap-widget-container">
            <div className="heatmap-labels-row">
              <span>11 weeks ago</span>
              <span>Today</span>
            </div>
            
            <div className="heatmap-grid">
              {heatmapDays.map((day, idx) => (
                <div
                  key={idx}
                  className="heatmap-cell"
                  style={{
                    opacity: getHeatmapOpacity(day.totalDuration),
                    backgroundColor: day.totalDuration > 0 ? "var(--color-accent)" : "var(--color-muted)",
                  }}
                  title={`${day.label}: ${
                    day.totalDuration > 0
                      ? formatSummaryDuration(day.totalDuration) + " spent"
                      : "No focus logged"
                  }`}
                />
              ))}
            </div>

            <div className="heatmap-legend">
              <span>Less</span>
              <div className="legend-block" style={{ opacity: 0.06, backgroundColor: "var(--color-muted)" }} />
              <div className="legend-block" style={{ opacity: 0.25 }} />
              <div className="legend-block" style={{ opacity: 0.5 }} />
              <div className="legend-block" style={{ opacity: 0.75 }} />
              <div className="legend-block" style={{ opacity: 1 }} />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Selected Date Insight progress circle */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            Daily Metrics — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <div className="ring-content-row">
            <div className="ring-graphics-wrapper">
              <svg className="ring-svg">
                <circle
                  className="ring-bg"
                  cx="70"
                  cy="70"
                  r={radius}
                  strokeWidth={strokeWidth}
                />
                <circle
                  className="ring-progress"
                  cx="70"
                  cy="70"
                  r={radius}
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

      {/* ─── ROW 3: Standard Charts (Recharts) ────────────────────────────────── */}
      <div className="analytics-grid-row">
        {/* Energy Level Correlation (Composed Chart) */}
        <div className="analytics-card">
          <div className="analytics-card-title">Energy Level Correlation</div>
          <div className="chart-wrapper">
            {completedSessions.length === 0 ? (
              <div className="hint-text" style={{ padding: "60px 0", textAlign: "center" }}>
                No focus logs to determine energy correlation.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={energyData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="energy"
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
                            <div className="chart-tooltip-title">{payload[0].payload.energy}</div>
                            <div className="chart-tooltip-value">
                              Duration: {payload[0].value} mins
                            </div>
                            <div className="chart-tooltip-value" style={{ color: "var(--color-muted)" }}>
                              Sidetracks: {payload[1].value} avg
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
                    dataKey="duration"
                    name="Avg Focus Duration (Min)"
                    fill="var(--color-accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sidetracks"
                    name="Avg Sidetracks"
                    stroke="var(--color-panic)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-panic)", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Estimation Accuracy (Donut Chart) */}
        <div className="analytics-card">
          <div className="analytics-card-title">Estimation Accuracy Target</div>
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
