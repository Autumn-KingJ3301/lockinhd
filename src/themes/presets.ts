import type { ThemeConfig } from "./types";

export const presets: ThemeConfig[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    author: "NightCity Hacker",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#ff007f", // Neon Magenta
        "--theme-color-panic-bg": "rgba(255, 0, 127, 0.08)",
        "--theme-color-panic-border": "rgba(255, 0, 127, 0.4)",
        "--theme-color-text": "#00f0ff", // Neon Cyan
        "--theme-color-muted": "#008fa0",
        "--theme-color-overlay-bg": "rgba(10, 5, 20, 0.85)", // Deep Purple-Black
        "--theme-color-container-bg": "#0f081d",
        "--theme-clock-face-bg": "rgba(0, 240, 255, 0.03)",
        "--theme-clock-hand-hour": "#00f0ff",
        "--theme-clock-hand-minute": "#00f0ff",
        "--theme-clock-hand-second": "#ff007f",
        "--theme-clock-center": "#ff007f",
        "--theme-clock-marker": "#00f0ff"
      },
      fonts: {
        "--theme-font-sans": "'Courier New', Courier, monospace",
        "--theme-font-mono": "'Courier New', Courier, monospace",
        "--theme-font-weight-bold": "800",
        "--theme-font-weight-normal": "400"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.0",
        "--theme-border-radius": "0px", // Hard rectangular edges
        "--theme-border-width": "2px",
        "--theme-padding-panel": "12px"
      },
      effects: {
        overlayType: "glitch",
        skyType: "sunset",
        skyColors: ["#0f081d", "#2b0a3d", "#5a085c", "#ff007f", "#00f0ff"],
        "--theme-text-glow": "0 0 8px rgba(0, 240, 255, 0.6), 0 0 15px rgba(0, 240, 255, 0.3)",
        "--theme-box-glow": "0 0 15px rgba(255, 0, 127, 0.25), inset 0 0 10px rgba(255, 0, 127, 0.1)",
        "--theme-critical-animation": "glitch-fast 0.15s infinite",
        "--theme-heartbeat-animation": "cyber-flicker 2.5s infinite"
      }
    },
    sounds: {
      tick: {
        type: "sawtooth",
        frequency: 1100,
        endFrequency: 330,
        duration: 0.025,
        gain: 0.015
      },
      warning: {
        type: "square",
        notes: [880, 987, 1046.5],
        durations: [0.08, 0.08, 0.22],
        delays: [0, 0.09, 0.18],
        gain: 0.035
      },
      alarm: {
        type: "sawtooth",
        notes: [587.33, 293.66, 587.33, 293.66],
        durations: [0.12, 0.12, 0.12, 0.12],
        delays: [0, 0.13, 0.26, 0.39],
        gain: 0.07
      }
    }
  },
  {
    id: "matrix",
    name: "Matrix Rain",
    author: "Operator",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#00ff00", // Matrix Green
        "--theme-color-panic-bg": "rgba(0, 255, 0, 0.04)",
        "--theme-color-panic-border": "rgba(0, 255, 0, 0.3)",
        "--theme-color-text": "#00ff00",
        "--theme-color-muted": "#008800",
        "--theme-color-overlay-bg": "rgba(0, 5, 0, 0.92)", // Monochromatic dark green-black
        "--theme-color-container-bg": "#000a00",
        "--theme-clock-face-bg": "rgba(0, 255, 0, 0.02)",
        "--theme-clock-hand-hour": "#00ff00",
        "--theme-clock-hand-minute": "#008800",
        "--theme-clock-hand-second": "#00ff00",
        "--theme-clock-center": "#00ff00",
        "--theme-clock-marker": "#006600"
      },
      fonts: {
        "--theme-font-sans": "'Consolas', 'Courier New', monospace",
        "--theme-font-mono": "'Consolas', 'Courier New', monospace",
        "--theme-font-weight-bold": "700",
        "--theme-font-weight-normal": "500"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.0",
        "--theme-border-radius": "2px",
        "--theme-border-width": "1px",
        "--theme-padding-panel": "16px"
      },
      effects: {
        overlayType: "matrix",
        skyType: "starry",
        skyColors: ["#000a00", "#002200", "#00ff00"],
        "--theme-text-glow": "0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.4)",
        "--theme-box-glow": "0 0 20px rgba(0, 255, 0, 0.2)",
        "--theme-critical-animation": "matrix-flicker 0.2s infinite",
        "--theme-heartbeat-animation": "matrix-pulse 3s infinite"
      }
    },
    sounds: {
      tick: {
        type: "sine",
        frequency: 1600,
        duration: 0.012,
        gain: 0.03
      },
      warning: {
        type: "sine",
        notes: [523.25, 659.25, 783.99, 1046.5],
        durations: [0.07, 0.07, 0.07, 0.14],
        delays: [0, 0.07, 0.14, 0.21],
        gain: 0.045
      },
      alarm: {
        type: "square",
        notes: [330, 330, 330],
        durations: [0.1, 0.1, 0.15],
        delays: [0, 0.15, 0.3],
        gain: 0.05
      }
    }
  },
  {
    id: "zen",
    name: "Zen Garden",
    author: "Peaceful Mind",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#789dab", // Soft Slate Blue
        "--theme-color-panic-bg": "rgba(120, 157, 171, 0.05)",
        "--theme-color-panic-border": "rgba(120, 157, 171, 0.25)",
        "--theme-color-text": "#2d4a56", // Slate Gray
        "--theme-color-muted": "#627d87",
        "--theme-color-overlay-bg": "rgba(240, 244, 246, 0.85)", // Warm Soft Light
        "--theme-color-container-bg": "#fcfdfe",
        "--theme-clock-face-bg": "rgba(120, 157, 171, 0.04)",
        "--theme-clock-hand-hour": "#789dab",
        "--theme-clock-hand-minute": "#9cb4be",
        "--theme-clock-hand-second": "#c1d0d6",
        "--theme-clock-center": "#789dab",
        "--theme-clock-marker": "#cbd7dc"
      },
      fonts: {
        "--theme-font-sans": "'Georgia', 'Times New Roman', serif",
        "--theme-font-mono": "'Courier New', Courier, monospace",
        "--theme-font-weight-bold": "500",
        "--theme-font-weight-normal": "300"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.15", // Relaxed spacing
        "--theme-border-radius": "16px", // Smooth rounded corners
        "--theme-border-width": "1px",
        "--theme-padding-panel": "20px"
      },
      effects: {
        overlayType: "zen",
        skyType: "moonlight",
        skyColors: ["#0d1a26", "#1c3247", "#32506d", "#789dab", "#fcfdfe"],
        "--theme-text-glow": "none",
        "--theme-box-glow": "0 8px 32px rgba(120, 157, 171, 0.08)",
        "--theme-critical-animation": "none",
        "--theme-heartbeat-animation": "soft-pulse 4s infinite ease-in-out"
      }
    },
    sounds: {
      tick: {
        type: "triangle",
        frequency: 261.63, // Soft C4 wood tap
        duration: 0.08,
        gain: 0.06
      },
      warning: {
        type: "sine",
        notes: [329.63, 392.00, 523.25], // E4 -> G4 -> C5
        durations: [0.6, 0.6, 0.8],
        delays: [0, 0.3, 0.6],
        gain: 0.06
      },
      alarm: {
        type: "sine",
        notes: [440, 440],
        durations: [0.5, 0.8],
        delays: [0, 0.45],
        gain: 0.05
      }
    }
  },
  {
    id: "doom",
    name: "Doom Strobe",
    author: "Demon Slayer",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#ff3300", // Lava Orange-Red
        "--theme-color-panic-bg": "rgba(255, 51, 0, 0.12)",
        "--theme-color-panic-border": "rgba(255, 51, 0, 0.6)",
        "--theme-color-text": "#ffffff", // Bleeding White
        "--theme-color-muted": "#aa2200",
        "--theme-color-overlay-bg": "rgba(5, 0, 0, 0.96)", // Jet Black
        "--theme-color-container-bg": "#0a0202",
        "--theme-clock-face-bg": "rgba(255, 51, 0, 0.03)",
        "--theme-clock-hand-hour": "#ff3300",
        "--theme-clock-hand-minute": "#ff3300",
        "--theme-clock-hand-second": "#990000",
        "--theme-clock-center": "#ff3300",
        "--theme-clock-marker": "#660000"
      },
      fonts: {
        "--theme-font-sans": "'Impact', 'Arial Black', sans-serif",
        "--theme-font-mono": "'Impact', 'Arial Black', sans-serif",
        "--theme-font-weight-bold": "900",
        "--theme-font-weight-normal": "700"
      },
      spacing: {
        "--theme-spacing-multiplier": "0.95", // Compact and aggressive
        "--theme-border-radius": "4px",
        "--theme-border-width": "3px",
        "--theme-padding-panel": "10px"
      },
      effects: {
        overlayType: "doom",
        skyType: "sunset",
        skyColors: ["#050000", "#1a0202", "#4a0606", "#990000", "#ff3300"],
        "--theme-text-glow": "0 0 12px rgba(255, 51, 0, 0.9), 0 0 25px rgba(255, 51, 0, 0.5)",
        "--theme-box-glow": "0 0 25px rgba(255, 51, 0, 0.4), inset 0 0 15px rgba(255, 51, 0, 0.2)",
        "--theme-critical-animation": "doom-shake 0.08s infinite, doom-strobe 0.1s infinite",
        "--theme-heartbeat-animation": "doom-pulse var(--theme-energy-speed, 1.2s) infinite ease-in-out"
      }
    },
    sounds: {
      tick: {
        type: "triangle",
        frequency: 75, // Heavy sub bass stomp
        endFrequency: 30,
        duration: 0.06,
        gain: 0.15
      },
      warning: {
        type: "sawtooth",
        notes: [82.41, 82.41, 82.41], // Low E2 guitar synth chug
        durations: [0.35, 0.35, 0.55],
        delays: [0, 0.45, 0.9],
        gain: 0.09
      },
      alarm: {
        type: "sawtooth",
        notes: [220, 246.94, 220, 246.94], // Siren screech
        durations: [0.22, 0.22, 0.22, 0.22],
        delays: [0, 0.22, 0.44, 0.66],
        gain: 0.11
      }
    }
  }
  ,
  {
    id: "vaporwave",
    name: "Vaporwave",
    author: "RetroFuture",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#ff6ec7",          // Neon Pink
        "--theme-color-panic-bg": "rgba(255, 110, 199, 0.08)",
        "--theme-color-panic-border": "rgba(255, 110, 199, 0.4)",
        "--theme-color-text": "#e8d5f5",           // Soft Lavender White
        "--theme-color-muted": "#a87fc4",
        "--theme-color-overlay-bg": "rgba(18, 6, 32, 0.88)", // Deep Violet-Black
        "--theme-color-container-bg": "#0e0420",
        "--theme-clock-face-bg": "rgba(255, 110, 199, 0.03)",
        "--theme-clock-hand-hour": "#c774e8",
        "--theme-clock-hand-minute": "#ff6ec7",
        "--theme-clock-hand-second": "#00e5ff",
        "--theme-clock-center": "#ff6ec7",
        "--theme-clock-marker": "#7b2d8b"
      },
      fonts: {
        "--theme-font-sans": "'Courier New', 'VT323', monospace",
        "--theme-font-mono": "'Courier New', Courier, monospace",
        "--theme-font-weight-bold": "700",
        "--theme-font-weight-normal": "400"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.05",
        "--theme-border-radius": "0px",
        "--theme-border-width": "1px",
        "--theme-padding-panel": "14px"
      },
      effects: {
        overlayType: "glitch",
        skyType: "sunset",
        skyColors: ["#0e0420", "#2d0a45", "#6b1a72", "#c2185b", "#ff6ec7", "#ffb3e6"],
        "--theme-text-glow": "0 0 10px rgba(255, 110, 199, 0.8), 0 0 20px rgba(199, 116, 232, 0.4)",
        "--theme-box-glow": "0 0 20px rgba(255, 110, 199, 0.3), inset 0 0 12px rgba(199, 116, 232, 0.15)",
        "--theme-critical-animation": "vaporwave-flicker 0.2s infinite",
        "--theme-heartbeat-animation": "vaporwave-pulse 3s infinite ease-in-out"
      }
    },
    sounds: {
      tick: {
        type: "sine",
        frequency: 880,
        endFrequency: 440,
        duration: 0.03,
        gain: 0.018
      },
      warning: {
        type: "sine",
        notes: [523.25, 659.25, 783.99, 1046.5],
        durations: [0.12, 0.12, 0.12, 0.25],
        delays: [0, 0.12, 0.24, 0.36],
        gain: 0.04
      },
      alarm: {
        type: "sine",
        notes: [880, 1108.73, 880, 1108.73],
        durations: [0.18, 0.18, 0.18, 0.18],
        delays: [0, 0.2, 0.4, 0.6],
        gain: 0.06
      }
    }
  },
  {
    id: "arctic",
    name: "Arctic Night",
    author: "Polar Wanderer",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#00e5b0",          // Borealis Teal
        "--theme-color-panic-bg": "rgba(0, 229, 176, 0.07)",
        "--theme-color-panic-border": "rgba(0, 229, 176, 0.35)",
        "--theme-color-text": "#cce8f4",           // Icy Blue-White
        "--theme-color-muted": "#5a8fa8",
        "--theme-color-overlay-bg": "rgba(2, 8, 20, 0.90)", // Deep Polar Night
        "--theme-color-container-bg": "#020c1b",
        "--theme-clock-face-bg": "rgba(0, 229, 176, 0.02)",
        "--theme-clock-hand-hour": "#00e5b0",
        "--theme-clock-hand-minute": "#00bcd4",
        "--theme-clock-hand-second": "#7c4dff",
        "--theme-clock-center": "#00e5b0",
        "--theme-clock-marker": "#0a3d5c"
      },
      fonts: {
        "--theme-font-sans": "'Trebuchet MS', 'Segoe UI', sans-serif",
        "--theme-font-mono": "'Consolas', 'Courier New', monospace",
        "--theme-font-weight-bold": "600",
        "--theme-font-weight-normal": "300"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.1",
        "--theme-border-radius": "6px",
        "--theme-border-width": "1px",
        "--theme-padding-panel": "16px"
      },
      effects: {
        overlayType: "none",
        skyType: "aurora",
        skyColors: ["#020c1b", "#041828", "#062338", "#0a3d5c", "#0d5a7a"],
        "--theme-text-glow": "0 0 8px rgba(0, 229, 176, 0.6), 0 0 16px rgba(0, 229, 176, 0.25)",
        "--theme-box-glow": "0 0 20px rgba(0, 229, 176, 0.15), 0 4px 30px rgba(0, 0, 0, 0.5)",
        "--theme-critical-animation": "arctic-pulse 0.3s infinite ease-in-out",
        "--theme-heartbeat-animation": "arctic-breathe 4s infinite ease-in-out"
      }
    },
    sounds: {
      tick: {
        type: "triangle",
        frequency: 740,
        duration: 0.04,
        gain: 0.022
      },
      warning: {
        type: "sine",
        notes: [392.00, 493.88, 587.33, 739.99],
        durations: [0.15, 0.15, 0.15, 0.3],
        delays: [0, 0.15, 0.3, 0.45],
        gain: 0.05
      },
      alarm: {
        type: "triangle",
        notes: [587.33, 493.88, 587.33, 739.99],
        durations: [0.2, 0.2, 0.2, 0.35],
        delays: [0, 0.22, 0.44, 0.66],
        gain: 0.07
      }
    }
  },
  {
    id: "deepspace",
    name: "Deep Space",
    author: "Cosmic Drifter",
    version: "1.0.0",
    styles: {
      colors: {
        "--theme-color-panic": "#c792ea",          // Nebula Violet
        "--theme-color-panic-bg": "rgba(199, 146, 234, 0.07)",
        "--theme-color-panic-border": "rgba(199, 146, 234, 0.35)",
        "--theme-color-text": "#e2e8f5",           // Starlight White
        "--theme-color-muted": "#7b8fc4",
        "--theme-color-overlay-bg": "rgba(2, 2, 12, 0.92)", // Void Black
        "--theme-color-container-bg": "#02020c",
        "--theme-clock-face-bg": "rgba(199, 146, 234, 0.02)",
        "--theme-clock-hand-hour": "#c792ea",
        "--theme-clock-hand-minute": "#82aaff",
        "--theme-clock-hand-second": "#ffcb6b",
        "--theme-clock-center": "#c792ea",
        "--theme-clock-marker": "#1a1a3e"
      },
      fonts: {
        "--theme-font-sans": "'Optima', 'Gill Sans', 'Segoe UI', sans-serif",
        "--theme-font-mono": "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        "--theme-font-weight-bold": "600",
        "--theme-font-weight-normal": "300"
      },
      spacing: {
        "--theme-spacing-multiplier": "1.08",
        "--theme-border-radius": "8px",
        "--theme-border-width": "1px",
        "--theme-padding-panel": "18px"
      },
      effects: {
        overlayType: "none",
        skyType: "starry",
        skyColors: ["#02020c", "#06061e", "#0d0a2e", "#160e3c", "#1e1050"],
        "--theme-text-glow": "0 0 10px rgba(199, 146, 234, 0.6), 0 0 22px rgba(130, 170, 255, 0.3)",
        "--theme-box-glow": "0 0 25px rgba(199, 146, 234, 0.2), 0 8px 40px rgba(0, 0, 0, 0.6)",
        "--theme-critical-animation": "nebula-flare 0.25s infinite",
        "--theme-heartbeat-animation": "cosmic-drift 5s infinite ease-in-out"
      }
    },
    sounds: {
      tick: {
        type: "sine",
        frequency: 528,
        endFrequency: 264,
        duration: 0.06,
        gain: 0.015
      },
      warning: {
        type: "sine",
        notes: [261.63, 329.63, 392.00, 523.25],
        durations: [0.2, 0.2, 0.2, 0.45],
        delays: [0, 0.2, 0.4, 0.6],
        gain: 0.04
      },
      alarm: {
        type: "sine",
        notes: [329.63, 392.00, 493.88, 587.33],
        durations: [0.25, 0.25, 0.25, 0.5],
        delays: [0, 0.27, 0.54, 0.81],
        gain: 0.055
      }
    }
  }
];
