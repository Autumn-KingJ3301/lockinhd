import React from "react";
import { useLockinStore } from "../../store/useLockinStore";
import { formatSummaryDuration } from "../../utils/timeFormatters";

export const SessionSetupView: React.FC = () => {
  const setupStep = useLockinStore((state) => state.setupStep);
  const setupTaskName = useLockinStore((state) => state.setupTaskName);
  const setupEstimatedDuration = useLockinStore((state) => state.setupEstimatedDuration);

  if (setupStep === "idle") return null;

  return (
    <div className="mode-container" key="setup">
      <div className="setup-card">
        <div className="setup-header">CALIBRATING SESSION</div>
        <div className="setup-task-name">{setupTaskName}</div>
        
        <div className="setup-steps-progress">
          <div className={`setup-progress-dot ${setupStep === "estimate" ? "active" : "completed"}`}>
            <span className="step-num">1</span>
            <span className="step-label">Time Estimate</span>
          </div>
          <div className="setup-progress-line"></div>
          <div className={`setup-progress-dot ${setupStep === "energy" ? "active" : ""}`}>
            <span className="step-num">2</span>
            <span className="step-label">Energy Level</span>
          </div>
        </div>

        <div className="setup-body">
          {setupStep === "estimate" && (
            <div className="setup-prompt-body">
              <p className="setup-nudge">ADHD brains struggle with time blindness. Let's calibrate: how long will this take?</p>
              <div className="setup-input-hint">Type e.g., <strong>25m</strong>, <strong>10m</strong>, <strong>1h</strong> or press <strong>Enter</strong> to skip.</div>
            </div>
          )}
          {setupStep === "energy" && (
            <div className="setup-prompt-body">
              <p className="setup-nudge">Check your energy level: 1 (low) to 5 (high).</p>
              <div className="setup-input-hint">Enter a rating from <strong>1</strong> to <strong>5</strong>, or press <strong>Enter</strong> to skip.</div>
              {setupEstimatedDuration !== null && (
                <div className="setup-stat-summary">
                  ⏱️ Estimated time: <strong>{formatSummaryDuration(setupEstimatedDuration)}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
