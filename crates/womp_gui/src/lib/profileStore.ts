import { create } from "zustand";
import { Profile } from "@/lib/types";
import { invoke } from "@tauri-apps/api/core";

interface ProfileStore {
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  initProfiles: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profiles: [],
  setProfiles: (profiles: Profile[]) => set({ profiles }),
  initProfiles: async () => {
    const profiles: Profile[] = await invoke("get_profiles");
    set({ profiles });
  },
}));
