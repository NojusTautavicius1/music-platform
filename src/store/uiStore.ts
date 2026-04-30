import { create } from "zustand";

type UIStore = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
