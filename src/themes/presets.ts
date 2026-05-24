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
        "--theme-text-glow": "0 0 12px rgba(255, 51, 0, 0.9), 0 0 25px rgba(255, 51, 0, 0.5)",
        "--theme-box-glow": "0 0 25px rgba(255, 51, 0, 0.4), inset 0 0 15px rgba(255, 51, 0, 0.2)",
        "--theme-critical-animation": "doom-shake 0.08s infinite, doom-strobe 0.1s infinite",
        "--theme-heartbeat-animation": "doom-pulse 1.2s infinite ease-in-out"
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
];
