import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useWindDownStore } from "../store/useWindDownStore";
import { useAuthStore } from "../store/useAuthStore";
import { CommandBar } from "../components/CommandBar";
import { activityRegistry } from "../components/windDown/registry";
import { formatSummaryDuration } from "../utils/timeFormatters";
import { AuroraCanvas } from "../components/AuroraCanvas";

export const WindDown: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  const activeActivityId = useWindDownStore((s) => s.activeActivityId);
  const tempAssociatedSession = useWindDownStore((s) => s.tempAssociatedSession);
  const moodRatingBefore = useWindDownStore((s) => s.moodRatingBefore);
  
  const selectActivity = useWindDownStore((s) => s.selectActivity);
  const exitWindDown = useWindDownStore((s) => s.exitWindDown);
  const setMoodBefore = useWindDownStore((s) => s.setMoodBefore);
  const toastMsg = useLockinStore((s) => s.toastMsg);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);

  const [preMoodSelected, setPreMoodSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Protection & Focus CommandBar
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== "INPUT" &&
        target.tagName !== "BUTTON" &&
        target.tagName !== "TEXTAREA" &&
        !target.closest(".mood-btn") &&
        !target.closest(".wind-down-mood-btn") &&
        !target.closest(".wind-down-activity-card") &&
        !target.closest(".action-button-group") &&
        !target.closest(".btn-secondary")
      ) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  // Esc back home
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitWindDown();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [exitWindDown, navigate]);

  // Set html class on mount for dimming & transition
  useEffect(() => {
    document.documentElement.classList.add("wind-down-active");
    return () => {
      document.documentElement.classList.remove("wind-down-active");
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

  if (loading) return null;

  const activePlugin = activityRegistry.find((act) => act.id === activeActivityId);

  return (
    <>
      <AuroraCanvas
        energyRating={1}
        blurAmount={32}
        baseOpacity={0.16}
        yOffset={-100}
        heightMultiplier={2.5}
        waveSpeedMultiplier={0.6}
        raySpeedMultiplier={0.4}
      />

      {toastMsg && (
        <div className="toast-notification" onClick={() => setToastMsg(null)} title="Click to dismiss">
          {toastMsg}
        </div>
      )}

      <div className="app-container zen-active" style={{ height: "600px" }}>
        <header className="app-header">
          <div className="app-title" style={{ letterSpacing: "0.2em", color: "var(--color-accent)" }}>WIND·DOWN</div>
          <div className="header-status">
            <div className="status-badge" style={{ color: "var(--color-accent)", borderColor: "var(--color-accent-border)", backgroundColor: "var(--color-accent-bg)" }}>
              <span>recovery</span>
            </div>
          </div>
        </header>

        <main className="app-content" style={{ position: "relative" }}>
          <div className="wind-down-view">
            {activePlugin ? (
              <activePlugin.component
                onComplete={(ratingAfter) => {
                  exitWindDown(ratingAfter);
                  navigate("/");
                }}
                onCancel={() => {
                  selectActivity(null);
                }}
              />
            ) : (
              <>
                <header className="wind-down-header">
                  <h1 className="wind-down-greeting">Take a Moment</h1>
                  <p className="wind-down-sub">Allow your mind to rest after your hard work.</p>
                </header>

                {tempAssociatedSession && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                    <div className="wind-down-session-info">
                      <span>Winding down from focus block:</span>
                      <br />
                      <strong>{tempAssociatedSession.task}</strong>
                      <br />
                      <span>Spent: {formatSummaryDuration(tempAssociatedSession.duration)}</span>
                    </div>
                  </div>
                )}

                {!preMoodSelected && moodRatingBefore === null ? (
                  <div className="wind-down-pre-selector">
                    <h3>How are you feeling right now?</h3>
                    <div className="mood-grid">
                      {[
                        { rating: 1, label: "😫" },
                        { rating: 2, label: "😐" },
                        { rating: 3, label: "🙂" },
                        { rating: 4, label: "😌" },
                        { rating: 5, label: "🧘" },
                      ].map((m) => (
                        <button
                          key={m.rating}
                          className="wind-down-mood-btn"
                          onClick={() => {
                            setMoodBefore(m.rating);
                            setPreMoodSelected(true);
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <button 
                      className="wind-down-btn-secondary" 
                      onClick={() => setPreMoodSelected(true)}
                      style={{ marginTop: "8px" }}
                    >
                      Skip Rating
                    </button>
                  </div>
                ) : (
                  <div className="wind-down-pre-selector">
                    <h3 style={{ marginBottom: "8px" }}>Select a recovery activity (optional):</h3>
                    <div className="wind-down-activity-grid" style={{ width: "100%" }}>
                      {activityRegistry.map((activity) => (
                        <button
                          key={activity.id}
                          className="wind-down-activity-card"
                          onClick={() => selectActivity(activity.id)}
                          style={{ width: "100%", background: "none", font: "inherit", color: "inherit" }}
                        >
                          <div className="wind-down-card-icon">{activity.icon}</div>
                          <div className="wind-down-card-info">
                            <span className="wind-down-card-title">{activity.name}</span>
                            <span className="wind-down-card-desc">{activity.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="wind-down-btn-row">
                      <button
                        className="wind-down-btn-primary"
                        onClick={() => {
                          exitWindDown();
                          navigate("/");
                        }}
                        style={{ minWidth: "140px" }}
                      >
                        Exit Wind Down
                      </button>
                      {(moodRatingBefore !== null || preMoodSelected) && (
                        <button
                          className="wind-down-btn-secondary"
                          onClick={() => {
                            setMoodBefore(null);
                            setPreMoodSelected(false);
                          }}
                        >
                          ← Re-rate Initial Mood
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <footer className="app-footer">
          <CommandBar ref={inputRef as any} />
        </footer>
      </div>
    </>
  );
};
