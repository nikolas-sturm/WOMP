import { webDarkTheme as darkBase, webLightTheme as lightBase, type Theme } from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { create } from "zustand";
import { buildTheme } from "@/lib/theme";

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
  activeTheme: "dark" | "light";
  darkTheme: Theme;
  lightTheme: Theme;
  error: string | null;
  initialized: boolean;
}

interface ThemeActions {
  getActiveTheme: () => Theme;
  toggleTheme: () => Promise<void>;
  initThemes: () => Promise<void>;
  setTheme: (theme: "dark" | "light") => Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

async function getThemes(): Promise<{darkTheme: Theme; lightTheme: Theme}> {
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
      lightTheme: lightBase 
    };
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  // State
  activeTheme: "dark",
  darkTheme: darkBase,
  lightTheme: lightBase,
  error: null,
  initialized: false,
  // Actions
  getActiveTheme: () => {
    const state = get();
    return state.activeTheme === "dark" ? state.darkTheme : state.lightTheme;
  },
  
  setTheme: async (theme: "dark" | "light") => {
    try {
      await invoke("change_theme", { dark: theme === "dark" });
      set({ activeTheme: theme });
    } catch (error) {
      console.error("Failed to set theme:", error);
      set({ error: "Failed to set theme" });
    }
  },
  
  toggleTheme: async () => {
    const { activeTheme } = get();
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    return get().setTheme(newTheme);
  },
  
  initThemes: async () => {
    set({ error: null });
    try {
      // Try to get system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? "dark" : "light";
      
      // Get theme colors
      const { darkTheme, lightTheme } = await getThemes();
      
      // Update state with themes and initial preference
      set({ 
        initialized: true,
        darkTheme, 
        lightTheme, 
        activeTheme: initialTheme, 
      });
      
      // Sync with system
      await invoke("change_theme", { dark: initialTheme === "dark" });
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => {
          get().setTheme(e.matches ? "dark" : "light");
        });
      
      // Listen for system accent color changes
      await listen<string[]>('system-colors-changed', async ({ payload }) => {
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
          ...darkBase,
          colorBrandBackground: systemColors.accent_light_2,
        };

        const updatedLightTheme = {
          ...lightBase,
          colorBrandBackground: systemColors.accent_dark_3,
        };

        // Update the store with new theme values
        set({
          darkTheme: updatedDarkTheme,
          lightTheme: updatedLightTheme
        });
      });
    } catch (error) {
      console.error("Failed to initialize themes:", error);
      set({ error: "Failed to initialize themes" });
    }
  }
}));