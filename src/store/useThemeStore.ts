import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeConfig } from "../themes/types";
import { presets } from "../themes/presets";
import { validateTheme } from "../themes/themeUtils";

export interface ThemeStoreState {
  activeThemeId: string; // "default" or preset id or custom id
  customThemes: ThemeConfig[];
}

export interface ThemeStoreActions {
  applyTheme: (id: string) => void;
  installTheme: (jsonStr: string) => ThemeConfig;
  uninstallTheme: (id: string) => void;
  getActiveTheme: () => ThemeConfig | null;
  getAllThemes: () => ThemeConfig[];
}

export type ThemeStore = ThemeStoreState & ThemeStoreActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      activeThemeId: "default",
      customThemes: [],

      applyTheme: (id) => {
        const lowerId = id.toLowerCase();
        if (lowerId === "default") {
          set({ activeThemeId: "default" });
          return;
        }
        
        const allThemes = get().getAllThemes();
        const found = allThemes.find((t) => t.id.toLowerCase() === lowerId);
        if (!found) {
          throw new Error(`Theme '${id}' not found`);
        }
        set({ activeThemeId: found.id });
      },

      installTheme: (jsonStr) => {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e: any) {
          throw new Error(`Invalid JSON syntax: ${e.message}`);
        }

        const validated = validateTheme(parsed);
        const lowerId = validated.id.toLowerCase();

        if (lowerId === "default") {
          throw new Error("Cannot overwrite the 'default' theme");
        }

        // Check if it conflicts with presets
        const presetConflict = presets.some((p) => p.id.toLowerCase() === lowerId);
        if (presetConflict) {
          throw new Error(`Cannot overwrite preset theme '${validated.id}'`);
        }

        set((state) => {
          const filtered = state.customThemes.filter((t) => t.id.toLowerCase() !== lowerId);
          return {
            customThemes: [...filtered, validated]
          };
        });

        return validated;
      },

      uninstallTheme: (id) => {
        const lowerId = id.toLowerCase();
        if (lowerId === "default") return;

        const isPreset = presets.some((p) => p.id.toLowerCase() === lowerId);
        if (isPreset) {
          throw new Error("Cannot uninstall a preset theme");
        }

        set((state) => {
          const nextActiveId = state.activeThemeId.toLowerCase() === lowerId ? "default" : state.activeThemeId;
          return {
            customThemes: state.customThemes.filter((t) => t.id.toLowerCase() !== lowerId),
            activeThemeId: nextActiveId
          };
        });
      },

      getActiveTheme: () => {
        const { activeThemeId, getAllThemes } = get();
        if (activeThemeId === "default") return null;
        return getAllThemes().find((t) => t.id === activeThemeId) || null;
      },

      getAllThemes: () => {
        const { customThemes } = get();
        return [...presets, ...customThemes];
      }
    }),
    {
      name: "lockin-theme-store"
    }
  )
);
