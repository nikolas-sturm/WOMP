import { type Theme, webDarkTheme } from "@fluentui/react-components";
import { create } from "zustand";

export const useThemeStore = create<{ theme: Theme, setTheme: (theme: Theme) => void }>((set) => ({
  theme: webDarkTheme,
  setTheme: (theme: Theme) => set({ theme }),
}));