export type OscillatorWaveType = "sine" | "square" | "sawtooth" | "triangle";

export interface SoundEnvelope {
  type: OscillatorWaveType;
  frequency: number;
  endFrequency?: number;
  duration: number; // in seconds
  gain: number;     // 0 to 1
}

export interface SoundSequence {
  type: OscillatorWaveType;
  notes: number[];       // Frequencies in Hz
  durations: number[];   // Duration of each note in seconds
  delays: number[];      // Delay/start offset of each note in seconds
  gain: number;          // 0 to 1
}

export interface ThemeSounds {
  tick?: SoundEnvelope;
  warning?: SoundSequence;
  alarm?: SoundSequence;
}

export interface ThemeStyles {
  // Theme custom variables that map directly to CSS properties
  colors: {
    "--theme-color-panic": string;
    "--theme-color-panic-bg": string;
    "--theme-color-panic-border": string;
    "--theme-color-text": string;
    "--theme-color-muted"?: string;
    "--theme-color-overlay-bg": string;
    "--theme-color-container-bg": string;
    "--theme-color-accent"?: string;
    "--theme-color-success"?: string;
    "--theme-clock-face-bg"?: string;
    "--theme-clock-hand-hour"?: string;
    "--theme-clock-hand-minute"?: string;
    "--theme-clock-hand-second"?: string;
    "--theme-clock-center"?: string;
    "--theme-clock-marker"?: string;
  };
  fonts: {
    "--theme-font-sans": string;
    "--theme-font-mono"?: string;
    "--theme-font-weight-bold"?: string;
    "--theme-font-weight-normal"?: string;
  };
  spacing: {
    "--theme-spacing-multiplier"?: string;
    "--theme-border-radius"?: string;
    "--theme-border-width"?: string;
    "--theme-padding-panel"?: string;
  };
  effects: {
    overlayType?: "matrix" | "glitch" | "zen" | "doom" | "none";
    skyType?: "aurora" | "moonlight" | "sunny" | "sunset" | "starry" | "none";
    skyColors?: string[];
    "--theme-text-glow"?: string;
    "--theme-box-glow"?: string;
    "--theme-critical-animation"?: string;
    "--theme-heartbeat-animation"?: string;
  };
}

export interface ThemeConfig {
  id: string;
  name: string;
  author?: string;
  version?: string;
  styles: ThemeStyles;
  sounds: ThemeSounds;
}
