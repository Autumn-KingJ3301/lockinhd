import React, { useState, useEffect, useRef } from "react";

interface MeditationActivityProps {
  onComplete: (moodRatingAfter: number) => void;
  onCancel: () => void;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const MINDFULNESS_PROMPTS = [
  "Let go of thoughts about what you just did.",
  "Feel the weight of your body resting here.",
  "You are here, in this present moment.",
  "Breathe in peace, breathe out tension.",
  "Observe your thoughts without judgment, like clouds passing.",
  "There is nothing you need to accomplish right now.",
  "Quiet the noise, listen to the silence inside.",
  "Allow yourself to just be.",
];

// Pentatonic scale frequencies (C Major Pentatonic)
const PENTATONIC = [
  130.81, // C3 (Bass drone element)
  196.00, // G3
  220.00, // A3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
];

export const MeditationActivity: React.FC<MeditationActivityProps> = ({ onComplete, onCancel }) => {
  const [promptIdx, setPromptIdx] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [moodPrompt, setMoodPrompt] = useState(false);
  const [meditationTime, setMeditationTime] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Formats time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Start background drone synth sound
  const startDrone = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Drone oscillator (warm triangle wave at C3)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(PENTATONIC[0], now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 2.0); // Slow fade-in

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      
      droneOscRef.current = osc;
      droneGainRef.current = gain;
    } catch (e) {
      console.warn("Could not start drone sound:", e);
    }
  };

  // Stop background drone synth
  const stopDrone = () => {
    try {
      const osc = droneOscRef.current;
      if (osc) {
        try {
          osc.stop();
        } catch (err) {}
        droneOscRef.current = null;
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        ctx.close().catch(() => {});
        audioCtxRef.current = null;
      }
    } catch (e) {}
  };

  // Play an interactive pentatonic note
  const playInteractiveNote = (x: number, width: number) => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Select frequency based on X coordinate
      const noteIdx = Math.floor((x / width) * (PENTATONIC.length - 2)) + 2; // skip bass drone
      const freq = PENTATONIC[Math.max(2, Math.min(PENTATONIC.length - 1, noteIdx))];

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass filter for warm, watery sound
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {}
  };

  // Trigger sound drone and visual loop
  useEffect(() => {
    startDrone();

    // Canvas Visualizer loop
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const resizeCanvas = () => {
          canvas.width = canvas.parentElement?.clientWidth || 400;
          canvas.height = 200;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Update and draw ripples
          ripplesRef.current = ripplesRef.current.map((r) => {
            r.radius += 1.2;
            r.alpha = 1 - r.radius / r.maxRadius;
            return r;
          }).filter((r) => r.alpha > 0);

          ripplesRef.current.forEach((r) => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, 2 * Math.PI);
            ctx.strokeStyle = `${r.color}${r.alpha * 0.25})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });

          // Draw a gentle ambient gradient background ripple
          const time = Date.now() * 0.001;
          const slowRadius = 60 + Math.sin(time) * 15;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, slowRadius, 0, 2 * Math.PI);
          const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, slowRadius
          );
          grad.addColorStop(0, "rgba(120, 157, 171, 0.08)");
          grad.addColorStop(1, "rgba(120, 157, 171, 0)");
          ctx.fillStyle = grad;
          ctx.fill();

          animationFrameRef.current = requestAnimationFrame(render);
        };
        render();

        return () => {
          window.removeEventListener("resize", resizeCanvas);
        };
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopDrone();
    };
  }, []);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setMeditationTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mindfulness Prompts cycle (cross-fading every 8 seconds)
  useEffect(() => {
    const promptTimer = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setPromptIdx((idx) => (idx + 1) % MINDFULNESS_PROMPTS.length);
        setFadeState("in");
      }, 800); // fade out duration
    }, 9000);

    return () => clearInterval(promptTimer);
  }, []);

  // Handle Canvas Interaction
  const handleInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = [
      "rgba(120, 157, 171, ",
      "rgba(156, 180, 190, ",
      "rgba(193, 208, 214, ",
      "rgba(98, 125, 135, ",
    ];
    const randColor = colors[Math.floor(Math.random() * colors.length)];

    // Add visual ripple
    ripplesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: 100 + Math.random() * 50,
      alpha: 1,
      color: randColor,
    });

    // Play chord note
    playInteractiveNote(x, canvas.width);
  };

  const handleFinish = (rating: number) => {
    stopDrone();
    onComplete(rating);
  };

  return (
    <div className="activity-container meditation-activity-container">
      <style>{`
        .meditation-activity-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 16px;
          min-height: 380px;
          text-align: center;
        }

        .meditation-prompt-card {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          width: 100%;
        }

        .meditation-prompt-text {
          font-family: var(--font-sans);
          font-size: 16px;
          line-height: 1.6;
          color: var(--color-text);
          transition: opacity 0.8s ease;
          opacity: 0;
          font-style: italic;
        }

        .meditation-prompt-text.fade-in {
          opacity: 0.95;
        }

        .canvas-visualizer-container {
          width: 100%;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
          cursor: crosshair;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
        }

        .canvas-visualizer-title {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-muted);
          padding: 4px;
          background-color: var(--color-bg);
          border-bottom: 0.5px solid var(--color-border);
          text-transform: uppercase;
        }

        .meditation-canvas {
          display: block;
          width: 100%;
          height: 170px;
        }

        .meditation-footer {
          display: flex;
          width: 100%;
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
          <div className="meditation-prompt-card">
            <p className={`meditation-prompt-text ${fadeState === "in" ? "fade-in" : ""}`}>
              "{MINDFULNESS_PROMPTS[promptIdx]}"
            </p>
          </div>

          <div className="canvas-visualizer-container">
            <div className="canvas-visualizer-title">✦ Click or drag to ripple & play ambient chords</div>
            <canvas
              ref={canvasRef}
              className="meditation-canvas"
              onMouseDown={handleInteraction}
            />
          </div>

          <div className="meditation-footer">
            <span>Relaxation Time: {formatTime(meditationTime)}</span>
            <div className="action-button-group">
              <button className="wind-down-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              {meditationTime >= 10 && (
                <button className="wind-down-btn-primary" onClick={() => setMoodPrompt(true)}>
                  Done Winding Down
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mood-after-selector" style={{ marginTop: "60px" }}>
          <h3>How relaxed do you feel now?</h3>
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
