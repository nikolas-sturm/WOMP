import type { Profile } from "@/lib/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

interface ProfileStore {
  activeProfile: string | null;
  profiles: Profile[];
  selectedProfile: Profile | "settings" | null;
  initialized: boolean;
  setProfiles: (profiles: Profile[]) => void;
  initProfiles: () => Promise<Profile[]>;
  setSelectedProfile: (profile: Profile | "settings" | null) => void;
}

export const useProfileStore = create<ProfileStore>((set, _) => ({
  activeProfile: null,
  profiles: [],
  selectedProfile: null,
  initialized: false,
  setProfiles: (profiles: Profile[]) => set({ profiles }),
  setSelectedProfile: (profile: Profile | "settings" | null) =>
    set({ selectedProfile: profile }),
  initProfiles: async () => {
    const profiles: Profile[] = await invoke("get_profiles");
    set({ profiles });
    const activeProfile: string | null = await invoke("get_active_profile");
    set({ activeProfile, initialized: true });
    return profiles;
  }
}));
