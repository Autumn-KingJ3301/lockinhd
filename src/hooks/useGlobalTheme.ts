import { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useLockinStore } from "../store/useLockinStore";
import { themeToCssVars } from "../themes/themeUtils";

export function useGlobalTheme() {
  const activeThemeId = useThemeStore((state) => state.activeThemeId);

  // Subscribe to all lockin state that computes the active energyRating
  const session = useLockinStore((state) => state.session);
  const mode = useLockinStore((state) => state.mode);
  const wrapData = useLockinStore((state) => state.wrapData);
  const setupStep = useLockinStore((state) => state.setupStep);
  const input = useLockinStore((state) => state.input);

  const energyRating =
    ((mode === "active" || mode === "panic") && session)
      ? (session.energyRating ?? 3)
      : ((mode === "wrap" && wrapData) ? (wrapData.energyRating ?? 3) : (
        mode === "wind-down" ? 1 : (
          setupStep === "energy" && /^[1-5]$/.test(input.trim()) ? parseInt(input.trim(), 10) : null
        )
      ));

  useEffect(() => {
    const activeTheme = useThemeStore.getState().getActiveTheme();
    const root = document.documentElement;

    // 1. Clean up any existing --theme- variables on the root style
    const keysToRemove: string[] = [];
    for (let i = 0; i < root.style.length; i++) {
      const key = root.style[i];
      if (key.startsWith("--theme-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => root.style.removeProperty(key));

    // 2. Inject new variables if a themed skin is selected
    if (activeTheme) {
      const cssVars = themeToCssVars(activeTheme);
      Object.entries(cssVars).forEach(([key, val]) => {
        if (val) {
          root.style.setProperty(key, String(val));
        }
      });
    }

    // 3. Inject energy variables reactively
    const energy = energyRating !== null ? energyRating : 3;
    const isSessionActive = energyRating !== null;
    
    // Scale duration: 1 -> 2.4s, 2 -> 1.8s, 3 -> 1.2s, 4 -> 0.8s, 5 -> 0.5s
    const energySpeed = energy === 1 ? "2.4s" : energy === 2 ? "1.8s" : energy === 3 ? "1.2s" : energy === 4 ? "0.8s" : "0.5s";
    
    // Scale glow: only glow if there's an active session
    const energyGlow = isSessionActive 
      ? (energy === 1 ? "0.4" : energy === 2 ? "0.7" : energy === 3 ? "1.0" : energy === 4 ? "1.3" : "1.7")
      : "0";
      
    // Scale opacity: 1 -> 0.5, 2 -> 0.75, 3 -> 1.0, 4 -> 1.1, 5 -> 1.2
    const energyOpacity = energy === 1 ? "0.5" : energy === 2 ? "0.75" : energy === 3 ? "1.0" : energy === 4 ? "1.1" : "1.2";

    root.style.setProperty("--theme-energy-level", String(energy));
    root.style.setProperty("--theme-energy-speed", energySpeed);
    root.style.setProperty("--theme-energy-glow-scale", energyGlow);
    root.style.setProperty("--theme-energy-opacity", energyOpacity);
  }, [activeThemeId, energyRating]);
}
