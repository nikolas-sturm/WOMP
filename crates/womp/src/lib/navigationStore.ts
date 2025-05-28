import { create } from "zustand";

interface NavigationStore {
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  selectedKey: null,
  setSelectedKey: (key: string | null) => set({ selectedKey: key }),
}));
