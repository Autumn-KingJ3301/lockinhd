import type { ThemeConfig, OscillatorWaveType } from "./types";

/**
 * Validates a theme object structure and throws an error if it's invalid.
 * If valid, returns a fully typed ThemeConfig.
 */
export function validateTheme(theme: any): ThemeConfig {
  if (!theme || typeof theme !== "object") {
    throw new Error("Theme must be a non-null object");
  }
  if (typeof theme.id !== "string" || !theme.id.trim()) {
    throw new Error("Theme must have a valid non-empty string 'id'");
  }
  if (typeof theme.name !== "string" || !theme.name.trim()) {
    throw new Error("Theme must have a valid non-empty string 'name'");
  }
  if (!theme.styles || typeof theme.styles !== "object") {
    throw new Error("Theme must have a 'styles' object");
  }
  if (!theme.styles.colors || typeof theme.styles.colors !== "object") {
    throw new Error("Theme must have a 'styles.colors' object");
  }

  // Required colors for basic Panic Modal functioning
  const requiredColors = [
    "--theme-color-panic",
    "--theme-color-panic-bg",
    "--theme-color-panic-border",
    "--theme-color-text",
    "--theme-color-overlay-bg",
    "--theme-color-container-bg"
  ];
  for (const color of requiredColors) {
    if (typeof theme.styles.colors[color] !== "string" || !theme.styles.colors[color].trim()) {
      throw new Error(`Theme missing required style color: '${color}'`);
    }
  }

  if (!theme.styles.fonts || typeof theme.styles.fonts !== "object") {
    throw new Error("Theme must have a 'styles.fonts' object");
  }
  if (typeof theme.styles.fonts["--theme-font-sans"] !== "string") {
    throw new Error("Theme missing required font: '--theme-font-sans'");
  }

  // Fallbacks for spacing
  const spacing = theme.styles.spacing || {};
  const stylesSpacing = {
    "--theme-spacing-multiplier": String(spacing["--theme-spacing-multiplier"] || "1.0"),
    "--theme-border-radius": String(spacing["--theme-border-radius"] || "4px"),
    "--theme-border-width": String(spacing["--theme-border-width"] || "1px"),
    "--theme-padding-panel": String(spacing["--theme-padding-panel"] || "16px"),
  };

  // Fallbacks for effects
  const effects = theme.styles.effects || {};
  const overlayType = effects.overlayType || "none";
  if (!["matrix", "glitch", "zen", "doom", "none"].includes(overlayType)) {
    throw new Error(`Invalid overlayType '${overlayType}'. Must be 'matrix', 'glitch', 'zen', 'doom', or 'none'.`);
  }

  const stylesEffects = {
    overlayType,
    "--theme-text-glow": String(effects["--theme-text-glow"] || "none"),
    "--theme-box-glow": String(effects["--theme-box-glow"] || "none"),
    "--theme-critical-animation": String(effects["--theme-critical-animation"] || "none"),
    "--theme-heartbeat-animation": String(effects["--theme-heartbeat-animation"] || "none"),
  };

  // Validate sounds
  const sounds = theme.sounds || {};
  const validatedSounds: any = {};

  const waveTypes: OscillatorWaveType[] = ["sine", "square", "sawtooth", "triangle"];

  if (sounds.tick) {
    const tick = sounds.tick;
    if (!waveTypes.includes(tick.type)) {
      throw new Error(`Invalid tick sound wave type '${tick.type}'`);
    }
    if (typeof tick.frequency !== "number" || tick.frequency <= 0) {
      throw new Error("Tick sound 'frequency' must be a positive number");
    }
    if (typeof tick.duration !== "number" || tick.duration <= 0) {
      throw new Error("Tick sound 'duration' must be a positive number");
    }
    if (typeof tick.gain !== "number" || tick.gain < 0 || tick.gain > 1) {
      throw new Error("Tick sound 'gain' must be a number between 0 and 1");
    }
    validatedSounds.tick = {
      type: tick.type,
      frequency: tick.frequency,
      endFrequency: tick.endFrequency,
      duration: tick.duration,
      gain: tick.gain
    };
  }

  const validateSequence = (seqName: string, seq: any) => {
    if (!seq) return undefined;
    if (!waveTypes.includes(seq.type)) {
      throw new Error(`Invalid ${seqName} sound wave type '${seq.type}'`);
    }
    if (!Array.isArray(seq.notes) || seq.notes.some((n: any) => typeof n !== "number" || n <= 0)) {
      throw new Error(`${seqName} sound 'notes' must be an array of positive numbers`);
    }
    if (!Array.isArray(seq.durations) || seq.durations.some((d: any) => typeof d !== "number" || d <= 0)) {
      throw new Error(`${seqName} sound 'durations' must be an array of positive numbers`);
    }
    if (!Array.isArray(seq.delays) || seq.delays.some((d: any) => typeof d !== "number" || d < 0)) {
      throw new Error(`${seqName} sound 'delays' must be an array of non-negative numbers`);
    }
    if (seq.notes.length !== seq.durations.length || seq.notes.length !== seq.delays.length) {
      throw new Error(`${seqName} sound 'notes', 'durations', and 'delays' arrays must be of equal length`);
    }
    if (typeof seq.gain !== "number" || seq.gain < 0 || seq.gain > 1) {
      throw new Error(`${seqName} sound 'gain' must be a number between 0 and 1`);
    }
    return {
      type: seq.type,
      notes: seq.notes,
      durations: seq.durations,
      delays: seq.delays,
      gain: seq.gain
    };
  };

  validatedSounds.warning = validateSequence("warning", sounds.warning);
  validatedSounds.alarm = validateSequence("alarm", sounds.alarm);

  return {
    id: theme.id.trim(),
    name: theme.name.trim(),
    author: typeof theme.author === "string" ? theme.author.trim() : undefined,
    version: typeof theme.version === "string" ? theme.version.trim() : undefined,
    styles: {
      colors: { ...theme.styles.colors },
      fonts: { ...theme.styles.fonts },
      spacing: stylesSpacing,
      effects: stylesEffects
    },
    sounds: validatedSounds
  };
}

/**
 * Maps a theme's style dictionary into CSS Custom Properties (inline styles React wrapper)
 */
export function themeToCssVars(theme: ThemeConfig): React.CSSProperties {
  const vars: Record<string, string> = {};

  // Map colors
  Object.entries(theme.styles.colors).forEach(([key, val]) => {
    if (val) vars[key] = val;
  });

  // Map fonts
  Object.entries(theme.styles.fonts).forEach(([key, val]) => {
    if (val) vars[key] = val;
  });

  // Map spacing
  Object.entries(theme.styles.spacing).forEach(([key, val]) => {
    if (val) vars[key] = val;
  });

  // Map effects
  Object.entries(theme.styles.effects).forEach(([key, val]) => {
    if (key !== "overlayType" && val) vars[key] = val;
  });

  return vars as React.CSSProperties;
}
