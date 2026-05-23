import React, { useState } from "react";
import { useLockinStore } from "../store/useLockinStore";
import type { RecurrenceType, RecurrenceData, CallbackTask } from "../types";

export const RecurrenceModal: React.FC = () => {
  const showRecurrenceModal = useLockinStore((state) => state.showRecurrenceModal);
  const setShowRecurrenceModal = useLockinStore((state) => state.setShowRecurrenceModal);
  const recurrenceModalTaskId = useLockinStore((state) => state.recurrenceModalTaskId);
  const schedules = useLockinStore((state) => state.schedules);
  const setRecurrence = useLockinStore((state) => state.setRecurrence);

  const task = schedules.find((s) => s.id === recurrenceModalTaskId);

  if (!showRecurrenceModal || !task) return null;

  return (
    <div className="recurrence-modal-overlay">
      <RecurrenceModalContent 
        key={task.id} 
        task={task} 
        onClose={() => setShowRecurrenceModal(false)} 
        onSave={setRecurrence}
      />
    </div>
  );
};

interface ContentProps {
  task: CallbackTask;
  onClose: () => void;
  onSave: (id: number, data: RecurrenceData | undefined) => void;
}

const RecurrenceModalContent: React.FC<ContentProps> = ({ task, onClose, onSave }) => {
  const [type, setType] = useState<RecurrenceType>(task.recurrence?.type || "daily");
  const [interval, setIntervalVal] = useState<number>(task.recurrence?.interval || 1);
  const [days, setDays] = useState<number[]>(task.recurrence?.days || []);

  const handleSave = () => {
    const recurrence: RecurrenceData = {
      type,
      interval,
      days: type === "custom_days" ? days : undefined,
    };
    onSave(task.id, recurrence);
    onClose();
  };

  const toggleDay = (day: number) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="recurrence-modal-container">
      <header className="recurrence-modal-header">
        <div className="recurrence-modal-badge">
          <span>RECURRENCE SETUP</span>
        </div>
        <button className="recurrence-modal-close-btn" onClick={onClose} title="Esc to Cancel">
          Minimize [ESC]
        </button>
      </header>

      <div className="recurrence-modal-visual-section">
        <div className="recurrence-modal-task-name">
          {task.task}
        </div>
        <div className="hint-text" style={{ marginTop: "4px" }}>
          Set this chore to repeat automatically
        </div>
      </div>

      <div className="recurrence-modal-panels">
        <div className="recurrence-modal-panel">
          <div className="section-label">Frequency</div>
          <div className="type-selector-integrated">
            {(["hourly", "daily", "weekly", "custom_days"] as RecurrenceType[]).map((t) => (
              <button
                key={t}
                className={`integrated-type-btn ${type === t ? "active" : ""}`}
                onClick={() => setType(t)}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="recurrence-modal-panel">
          <div className="section-label">Options</div>
          <div className="integrated-form-group">
            {(type === "hourly" || type === "daily" || type === "weekly") && (
              <>
                <label>Repeat every</label>
                <div className="integrated-interval">
                  <input
                    type="number"
                    min="1"
                    className="command-input"
                    value={interval}
                    onChange={(e) => setIntervalVal(parseInt(e.target.value, 10) || 1)}
                    style={{ width: "60px", textAlign: "center", border: "0.5px solid var(--color-border)" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    {type === "hourly" ? "hour(s)" : type === "daily" ? "day(s)" : "week(s)"}
                  </span>
                </div>
              </>
            )}

            {type === "custom_days" && (
              <>
                <label>Repeat on</label>
                <div className="integrated-days">
                  {weekdays.map((day, idx) => (
                    <button
                      key={day}
                      className={`integrated-day-btn ${days.includes(idx) ? "active" : ""}`}
                      onClick={() => toggleDay(idx)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="recurrence-modal-footer">
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="save-btn-integrated" onClick={handleSave}>Apply</button>
          <button className="cancel-btn-integrated" onClick={onClose}>Cancel</button>
        </div>
        <button 
          className="clear-btn-integrated" 
          onClick={() => {
            onSave(task.id, undefined);
            onClose();
          }}
        >
          Remove Recurrence
        </button>
      </footer>
    </div>
  );
};
