import { create } from "zustand";

interface NavigationStore {
  selectedKey: string;
  setSelectedKey: (key: string) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  selectedKey: "home",
  setSelectedKey: (key: string) => set({ selectedKey: key }),
}));
