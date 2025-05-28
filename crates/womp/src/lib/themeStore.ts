import { buildTheme } from "@/lib/theme";
import {
  type Theme,
  webDarkTheme as darkBase,
  webLightTheme as lightBase,
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { ThemeOption, useGlobalConfigStore } from "./globalConfig";

export interface AccentColors {
  background: string;
  foreground: string;
  accent_dark_3: string;
  accent_dark_2: string;
  accent_dark_1: string;
  accent: string;
  accent_light_1: string;
  accent_light_2: string;
  accent_light_3: string;
}

interface ThemeState {
  activeTheme: ThemeOption;
  systemPreference: "dark" | "light";
  darkTheme: Theme;
  lightTheme: Theme;
  error: string | null;
  initialized: boolean;
}

interface ThemeActions {
  getActiveTheme: () => Theme;
  getActiveThemeName: () => "dark" | "light";
  initThemes: () => Promise<void>;
  setTheme: (theme: ThemeOption) => Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

async function getThemes(): Promise<{ darkTheme: Theme; lightTheme: Theme }> {
  try {
    const colorArray: string[] = await invoke("get_system_colors");

    const systemColors: AccentColors = {
      background: colorArray[0],
      foreground: colorArray[1],
      accent_dark_3: colorArray[2],
      accent_dark_2: colorArray[3],
      accent_dark_1: colorArray[4],
      accent: colorArray[5],
      accent_light_1: colorArray[6],
      accent_light_2: colorArray[7],
      accent_light_3: colorArray[8],
    };

    const darkTheme = buildTheme("dark", systemColors);

    const lightTheme = buildTheme("light", systemColors);

    return { darkTheme, lightTheme };
  } catch (error) {
    console.error("Failed to get system colors:", error);
    return {
      darkTheme: darkBase,
      lightTheme: lightBase,
    };
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  // State
  activeTheme: "system",
  systemPreference: "dark",
  darkTheme: darkBase,
  lightTheme: lightBase,
  error: null,
  initialized: false,
  // Actions
  getActiveTheme: () => {
    const state = get();
    const themeToUse = state.activeTheme === "system"
      ? state.systemPreference
      : state.activeTheme as "dark" | "light";

    return themeToUse === "dark" ? state.darkTheme : state.lightTheme;
  },
  getActiveThemeName: () => {
    const state = get();
    const themeToUse = state.activeTheme === "system"
      ? state.systemPreference
      : state.activeTheme as "dark" | "light";

    return themeToUse;
  },
  setTheme: async (theme: ThemeOption) => {
    try {
      // Apply the theme at system level
      await invoke("change_theme", { theme });

      // Update the theme store state
      set({ activeTheme: theme });

      // Save to global config
      const globalConfigStore = useGlobalConfigStore.getState();
      globalConfigStore.setGlobalConfig({
        ...globalConfigStore.globalConfig,
        theme: theme
      });
    } catch (error) {
      console.error("Failed to set theme:", error);
      set({ error: "Failed to set theme" });
    }
  },

  initThemes: async () => {
    set({ error: null });
    try {
      // Get user's config first
      const globalConfig = useGlobalConfigStore.getState().globalConfig;
      const savedTheme = globalConfig.theme;

      // Detect system preference for dark mode
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const systemPreference = prefersDark ? "dark" : "light";

      // Get theme colors
      const { darkTheme, lightTheme } = await getThemes();

      // Update state with themes and saved preference
      set({
        initialized: true,
        darkTheme,
        lightTheme,
        activeTheme: savedTheme,
        systemPreference
      });

      // Apply the theme to the window
      await invoke("change_theme", { theme: savedTheme });

      // Listen for system theme changes - only apply if theme is set to "system"
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          const newSystemPreference = e.matches ? "dark" : "light";
          set({ systemPreference: newSystemPreference });
        });

      // Listen for system accent color changes
      await listen<string[]>("system-colors-changed", async ({ payload }) => {
        const systemColors: AccentColors = {
          background: payload[0],
          foreground: payload[1],
          accent_dark_3: payload[2],
          accent_dark_2: payload[3],
          accent_dark_1: payload[4],
          accent: payload[5],
          accent_light_1: payload[6],
          accent_light_2: payload[7],
          accent_light_3: payload[8],
        };

        // Update themes with new accent colors
        const updatedDarkTheme = {
          ...darkTheme,
          colorBrandBackground: systemColors.accent_light_2,
        };

        const updatedLightTheme = {
          ...lightTheme,
          colorBrandBackground: systemColors.accent_dark_3,
        };

        // Update the store with new theme values
        set({
          darkTheme: updatedDarkTheme,
          lightTheme: updatedLightTheme,
        });
      });
    } catch (error) {
      console.error("Failed to initialize themes:", error);
      set({ error: "Failed to initialize themes" });
    }
  },
}));
