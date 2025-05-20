import type { Profile } from "@/lib/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

interface ProfileStore {
  profiles: Profile[];
  selectedProfile: Profile | "settings" | null;
  setProfiles: (profiles: Profile[]) => void;
  initProfiles: () => Promise<Profile[]>;
  setSelectedProfile: (profile: Profile | "settings" | null) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  selectedProfile: null,
  setProfiles: (profiles: Profile[]) => set({ profiles }),
  setSelectedProfile: (profile: Profile | "settings" | null) =>
    set({ selectedProfile: profile }),
  initProfiles: async () => {
    const profiles: Profile[] = await invoke("get_profiles");
    set({ profiles });
    return profiles;
  },
}));
