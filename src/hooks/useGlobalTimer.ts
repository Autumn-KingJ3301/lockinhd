import { useEffect } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { playThemeTickSound, playThemePanicExpiredAlarm, playThemeWarningSound } from "../utils/audioSynth";

export const useGlobalTimer = () => {
  const mode = useLockinStore((state) => state.mode);
  const session = useLockinStore((state) => state.session);
  const elapsed = useLockinStore((state) => state.elapsed);
  const soundEnabled = useLockinStore((state) => state.soundEnabled);
  const tickElapsed = useLockinStore((state) => state.tickElapsed);
  const checkCallbacks = useLockinStore((state) => state.checkCallbacks);

  // Active Timer Effect & Callback Checker
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (mode === "active" || mode === "panic") {
        tickElapsed();
      }
      checkCallbacks();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [mode, tickElapsed, checkCallbacks]);

  // Panic Ticks and Alarm sound effect
  useEffect(() => {
    const isPanic = mode === "panic" && session?.panicEndElapsed !== undefined;
    const isTimer = mode === "active" && session?.timerEndElapsed !== undefined;

    if (isPanic || isTimer) {
      const endElapsed = isPanic ? session!.panicEndElapsed! : session!.timerEndElapsed!;
      const remaining = endElapsed - elapsed;
      if (remaining === 120) {
        if (soundEnabled) {
          try { playThemeWarningSound(); } catch (e) { }
        }
      }
      if (remaining === 0) {
        if (soundEnabled) {
          try { playThemePanicExpiredAlarm(); } catch (e) { }
        }
      } else if (remaining < 0) {
        // Overtime beep alarm every 10 seconds
        if (remaining % 10 === 0 && soundEnabled) {
          try { playThemePanicExpiredAlarm(); } catch (e) { }
        }
      } else if (remaining <= 15) {
        // Play click tick every second for critical urgency
        if (soundEnabled) {
          try { playThemeTickSound(); } catch (e) { }
        }
      } else if (remaining <= 30) {
        // Play click tick every 3 seconds for mild warning
        if (remaining % 3 === 0 && soundEnabled) {
          try { playThemeTickSound(); } catch (e) { }
        }
      }
    }
  }, [elapsed, mode, session, soundEnabled]);
};
