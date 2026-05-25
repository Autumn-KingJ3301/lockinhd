import React, { useState, useEffect, useRef } from "react";

interface BreathingActivityProps {
  onComplete: (moodRatingAfter: number) => void;
  onCancel: () => void;
}

type Phase = "inhale" | "holdIn" | "exhale" | "holdOut";

const PHASE_DETAILS: Record<Phase, { title: string; instruction: string; color: string; scale: number }> = {
  inhale: { title: "Inhale", instruction: "Breathe in slowly...", color: "var(--color-accent)", scale: 1.5 },
  holdIn: { title: "Hold", instruction: "Suspend your breath...", color: "var(--color-success)", scale: 1.5 },
  exhale: { title: "Exhale", instruction: "Release the air gently...", color: "var(--color-muted)", scale: 1.0 },
  holdOut: { title: "Hold", instruction: "Rest before the next breath...", color: "var(--color-border)", scale: 1.0 },
};

export const BreathingActivity: React.FC<BreathingActivityProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsInPhase, setSecondsInPhase] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [moodRating, setMoodRating] = useState<number | null>(null);
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

  // Play a gentle bell/chime using AudioContext synth
  const playPhaseSound = (freq: number, duration: number) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtxClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      // Soft vibrato
      osc.frequency.linearRampToValueAtTime(freq + 4, now + duration);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("AudioContext play failed:", e);
    }
  };

  useEffect(() => {
    // Play sound on phase change
    const freqs: Record<Phase, number> = {
      inhale: 523.25, // C5
      holdIn: 659.25, // E5
      exhale: 440.00, // A4
      holdOut: 349.23, // F4
    };
    playPhaseSound(freqs[phase], 0.6);

    const interval = setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          setPhase((curr) => {
            if (curr === "inhale") return "holdIn";
            if (curr === "holdIn") return "exhale";
            if (curr === "exhale") return "holdOut";
            // completed a full cycle
            setCompletedCycles((c) => c + 1);
            return "inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle finalize mood & complete
  const handleFinish = (rating: number) => {
    onComplete(rating);
  };

  const details = PHASE_DETAILS[phase];

  return (
    <div className="activity-container breathing-activity-container">
      <style>{`
        .breathing-activity-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          padding: 24px;
          min-height: 380px;
          text-align: center;
        }

        .breathing-circle-wrapper {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .breathing-outer-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px dashed var(--color-border);
          border-radius: 50%;
          opacity: 0.4;
        }

        .breathing-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color-accent-bg) 0%, rgba(120, 157, 171, 0.25) 100%);
          border: 1px solid var(--color-accent-border);
          transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1), background-color 1s ease, border-color 1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 32px var(--color-accent-bg);
        }

        .breathing-circle-text {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
        }

        .breathing-status-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breathing-phase-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .breathing-phase-instruction {
          font-size: 13px;
          color: var(--color-muted);
          min-height: 20px;
        }

        .breathing-stats {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-muted);
          border-top: 0.5px solid var(--color-border);
          padding-top: 12px;
          width: 100%;
          display: flex;
          justify-content: space-around;
        }

        .mood-after-selector {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeUp 0.3s ease-out forwards;
          align-items: center;
        }

        .mood-grid {
          display: flex;
          gap: 12px;
        }

        .action-button-group {
          display: flex;
          gap: 12px;
        }
      `}</style>

      {moodRating === null ? (
        <>
          <div className="breathing-circle-wrapper">
            <div className="breathing-outer-ring"></div>
            <div
              className="breathing-circle"
              style={{
                transform: `scale(${details.scale})`,
                borderColor: details.color,
              }}
            >
              <div className="breathing-circle-text">{secondsInPhase}s</div>
            </div>
          </div>

          <div className="breathing-status-group">
            <h2 className="breathing-phase-title" style={{ color: details.color }}>
              {details.title}
            </h2>
            <p className="breathing-phase-instruction">{details.instruction}</p>
          </div>

          <div className="breathing-stats">
            <span>Completed Cycles: {completedCycles}</span>
            <span>Target: 4 Cycles (~1 min)</span>
          </div>

          <div className="action-button-group">
            <button className="wind-down-btn-secondary" onClick={onCancel}>
              Exit Activity
            </button>
            {completedCycles >= 1 && (
              <button
                className="wind-down-btn-primary"
                onClick={() => setMoodRating(0)} // Triggers mood prompt
              >
                Complete & Log
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="mood-after-selector">
          <h3>How do you feel after breathing?</h3>
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
          <button className="wind-down-btn-secondary" onClick={() => setMoodRating(null)}>
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
};
