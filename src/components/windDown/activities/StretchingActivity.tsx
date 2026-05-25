import React, { useState, useEffect, useRef } from "react";

interface StretchingActivityProps {
  onComplete: (moodRatingAfter: number) => void;
  onCancel: () => void;
}

interface Stretch {
  title: string;
  instruction: string;
  duration: number; // in seconds
  icon: string; // descriptive emoji or symbol
  details: string[];
}

const STRETCHES: Stretch[] = [
  {
    title: "Neck Release",
    instruction: "Gently lower your right ear toward your right shoulder.",
    duration: 15,
    icon: "🧘‍♀️",
    details: [
      "Keep your shoulders down and relaxed.",
      "For a deeper stretch, place your right hand lightly on your head.",
      "Slowly roll to the left after 7 seconds."
    ]
  },
  {
    title: "Shoulder Rolls",
    instruction: "Roll your shoulders slowly backwards in circular motion.",
    duration: 15,
    icon: "🔄",
    details: [
      "Inhale as you lift shoulders up to your ears.",
      "Exhale as you roll them back and down.",
      "Feel the release in your upper back."
    ]
  },
  {
    title: "Wrist & Forearm Release",
    instruction: "Extend right arm forward, fingers down. Pull gently with left hand.",
    duration: 15,
    icon: "👋",
    details: [
      "Keep your elbow straight but not locked.",
      "Switch to left arm after 7 seconds.",
      "Relieves keyboard fatigue."
    ]
  },
  {
    title: "Seated Spinal Twist",
    instruction: "Sit tall, place right hand on left knee, twist torso to the left.",
    duration: 15,
    icon: "🌪️",
    details: [
      "Keep both feet flat on the floor.",
      "Inhale to grow tall, exhale to twist deeper.",
      "Switch sides after 7 seconds."
    ]
  }
];

export const StretchingActivity: React.FC<StretchingActivityProps> = ({ onComplete, onCancel }) => {
  const [stretchIdx, setStretchIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(STRETCHES[0].duration);
  const [moodPrompt, setMoodPrompt] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  // Gentle synth note to alert stretch switch
  const playSwitchChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtxClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  };

  useEffect(() => {
    if (moodPrompt) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          playSwitchChime();
          // Move to next stretch
          if (stretchIdx < STRETCHES.length - 1) {
            setStretchIdx((i) => i + 1);
            return STRETCHES[stretchIdx + 1].duration;
          } else {
            // Completed all stretches
            clearInterval(timer);
            setMoodPrompt(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stretchIdx, moodPrompt]);

  const handleFinish = (rating: number) => {
    onComplete(rating);
  };

  const activeStretch = STRETCHES[stretchIdx];
  const progressPercent = Math.round((secondsRemaining / activeStretch.duration) * 100);

  return (
    <div className="activity-container stretching-activity-container">
      <style>{`
        .stretching-activity-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px;
          min-height: 380px;
          text-align: center;
        }

        .stretch-progress-dots {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stretch-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-border);
          transition: all 0.3s;
        }

        .stretch-dot.active {
          background-color: var(--color-accent);
          transform: scale(1.2);
        }

        .stretch-dot.completed {
          background-color: var(--color-success);
        }

        .stretch-icon-box {
          font-size: 56px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .stretch-body-card {
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 8px;
          padding: 16px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .stretch-timer-bar {
          height: 4px;
          width: 100%;
          background-color: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .stretch-timer-fill {
          height: 100%;
          background-color: var(--color-accent);
          transition: width 1s linear;
        }

        .stretch-bullets {
          font-size: 12px;
          color: var(--color-muted);
          list-style-type: disc;
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stretching-footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          border-top: 0.5px solid var(--color-border);
          padding-top: 14px;
          margin-top: 8px;
        }
      `}</style>

      {!moodPrompt ? (
        <>
          <div className="stretch-progress-dots">
            {STRETCHES.map((_, i) => (
              <div
                key={i}
                className={`stretch-dot ${i === stretchIdx ? "active" : i < stretchIdx ? "completed" : ""}`}
              />
            ))}
          </div>

          <div className="stretch-icon-box">{activeStretch.icon}</div>

          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-accent)" }}>
            {activeStretch.title}
          </h2>

          <div className="stretch-body-card">
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>
              {activeStretch.instruction}
            </p>
            <div className="stretch-timer-bar">
              <div className="stretch-timer-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <ul className="stretch-bullets">
              {activeStretch.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div className="stretching-footer">
            <span>Next posture in {secondsRemaining}s</span>
            <div className="action-button-group">
              <button className="wind-down-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              {stretchIdx < STRETCHES.length - 1 ? (
                <button
                  className="wind-down-btn-secondary"
                  onClick={() => {
                    playSwitchChime();
                    setStretchIdx((i) => i + 1);
                    setSecondsRemaining(STRETCHES[stretchIdx + 1].duration);
                  }}
                >
                  Skip →
                </button>
              ) : (
                <button className="wind-down-btn-primary" onClick={() => setMoodPrompt(true)}>
                  Done Stretching
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mood-after-selector" style={{ marginTop: "60px" }}>
          <h3>How does your body feel now?</h3>
          <div className="mood-grid">
            {[
              { rating: 1, label: "😫" },
              { rating: 2, label: "😐" },
              { rating: 3, label: "🙂" },
              { rating: 4, label: "😌" },
              { rating: 5, label: "🧘" },
            ].map((m) => (
              <button key={m.rating} className="wind-down-mood-btn" onClick={() => handleFinish(m.rating)}>
                {m.label}
              </button>
            ))}
          </div>
          <button className="wind-down-btn-secondary" onClick={() => setMoodPrompt(false)}>
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
};
