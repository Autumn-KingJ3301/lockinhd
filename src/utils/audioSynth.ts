import { useThemeStore } from "../store/useThemeStore";
import type { ThemeConfig } from "../themes/types";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playPopSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

export function playChimeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  // Play a beautiful ascending major arpeggio
  playNote(523.25, now, 0.35);        // C5
  playNote(659.25, now + 0.06, 0.35);  // E5
  playNote(783.99, now + 0.12, 0.35);  // G5
  playNote(1046.50, now + 0.18, 0.45); // C6
}

export function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Short click: high freq, rapid decay
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}

export function playPanicExpiredAlarm() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const playBeep = (startTime: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Retro alarm feel using sawtooth/triangle
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.linearRampToValueAtTime(350, startTime + 0.15);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  };

  // Play double beep
  playBeep(now);
  playBeep(now + 0.2);
}

export function playTransitionWarningSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const playNote = (freq: number, startTime: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  // Gentle C6 -> G5 soft chime warning
  playNote(1046.50, now, 0.4);
  playNote(783.99, now + 0.15, 0.5);
}

export function playMegaChimeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = "triangle", gainVal = 0.08) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  // Play a glorious cascading mega arpeggio
  // C4, E4, G4, C5, E5, G5, C6, E6, G6, C7
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
  notes.forEach((freq, idx) => {
    playNote(freq, now + idx * 0.06, 0.5, "sine", 0.06);
    // Add a secondary subtle triangle note for warmth
    if (idx % 2 === 0) {
      playNote(freq * 1.5, now + idx * 0.06 + 0.02, 0.4, "triangle", 0.02);
    }
  });
}

function playSequence(seq: { type: any; notes: number[]; durations: number[]; delays: number[]; gain: number }) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  seq.notes.forEach((freq: number, idx: number) => {
    const noteDuration = seq.durations[idx];
    const delay = seq.delays[idx];
    const startTime = now + delay;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = seq.type;
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(seq.gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export function playThemeTickSound() {
  const activeTheme = useThemeStore.getState().getActiveTheme();
  if (activeTheme && activeTheme.sounds.tick) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const config = activeTheme.sounds.tick;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, now);
    if (config.endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(config.endFrequency, now + config.duration);
    }

    gainNode.gain.setValueAtTime(config.gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + config.duration);
  } else {
    playTickSound();
  }
}

export function playThemeWarningSound() {
  const activeTheme = useThemeStore.getState().getActiveTheme();
  if (activeTheme && activeTheme.sounds.warning) {
    playSequence(activeTheme.sounds.warning);
  } else {
    playTransitionWarningSound();
  }
}

export function playThemePanicExpiredAlarm() {
  const activeTheme = useThemeStore.getState().getActiveTheme();
  if (activeTheme && activeTheme.sounds.alarm) {
    playSequence(activeTheme.sounds.alarm);
  } else {
    playPanicExpiredAlarm();
  }
}

export function playWarningForTheme(theme: ThemeConfig) {
  if (theme && theme.sounds.warning) {
    playSequence(theme.sounds.warning);
  } else {
    playTransitionWarningSound();
  }
}


