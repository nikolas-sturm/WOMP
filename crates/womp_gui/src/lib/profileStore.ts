import type { Profile } from "@/lib/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

interface ProfileStore {
  profiles: Profile[];
  selectedProfile: Profile | "settings" | null;
  initialized: boolean;
  setProfiles: (profiles: Profile[]) => void;
  initProfiles: () => Promise<Profile[]>;
  updateProfiles: () => Promise<Profile[]>;
  setSelectedProfile: (profile: Profile | "settings" | null) => void;
}

export const useProfileStore = create<ProfileStore>((set, _) => ({
  profiles: [],
  selectedProfile: null,
  initialized: false,
  setProfiles: (profiles: Profile[]) => set({ profiles }),
  setSelectedProfile: (profile: Profile | "settings" | null) =>
    set({ selectedProfile: profile }),
  initProfiles: async () => {
    const profiles: Profile[] = await invoke("get_profiles");
    set({ profiles, initialized: true });
    return profiles;
  },
  updateProfiles: async () => {
    const profiles: Profile[] = await invoke("get_profiles");
    set({ profiles });
    return profiles;
  },
}));
