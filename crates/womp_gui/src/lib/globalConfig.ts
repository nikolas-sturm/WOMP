import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export type ThemeOption = "system" | "dark" | "light";

export interface GlobalConfig {
  autostart: boolean;
  theme: ThemeOption;
  save_dpi_scale: boolean;
  save_icon_size: boolean;
  save_hdr_state: boolean;
  save_sdr_white_level: boolean;
  save_wallpaper_info: boolean;
}

interface GlobalConfigStore {
  globalConfig: GlobalConfig;
  getGlobalConfig: () => Promise<GlobalConfig>;
  setGlobalConfig: (globalConfig: GlobalConfig) => void;
}

export const useGlobalConfigStore = create<GlobalConfigStore>((set) => ({
  globalConfig: {
    autostart: false,
    theme: "system",
    save_dpi_scale: false,
    save_icon_size: false,
    save_hdr_state: false,
    save_sdr_white_level: false,
    save_wallpaper_info: false,
  },
  getGlobalConfig: async () => {
    const globalConfig = await invoke<GlobalConfig>("get_global_config");
    set({ globalConfig });
    return globalConfig;
  },
  setGlobalConfig: (globalConfig: GlobalConfig) => {
    invoke("set_global_config", { globalConfig });
    set({ globalConfig });
  },
}));