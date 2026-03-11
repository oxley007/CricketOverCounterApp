import { create } from "zustand";

type UIState = {
  saving: boolean;
  setSaving: (value: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  saving: false,
  setSaving: (value) => set({ saving: value }),
}));
