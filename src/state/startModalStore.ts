import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface StartModalState {
  isOpen: boolean;
  selectedMode: "ballCounter" | "scorebook" | null;
  hasHydrated: boolean;

  open: () => void;
  close: () => void;
  selectBallCounter: () => void;
  selectScorebook: () => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useStartModalStore = create<StartModalState>()(
  persist(
    (set) => ({
      isOpen: true,
      selectedMode: null,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      selectBallCounter: () => set({ selectedMode: "ballCounter", isOpen: false }),
      selectScorebook: () => set({ selectedMode: "scorebook", isOpen: false }),
      reset: () => set({ isOpen: true, selectedMode: null }),
    }),
    {
      name: "cricket-start-modal",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ selectedMode: s.selectedMode }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);

        if (!state?.selectedMode) {
          state!.isOpen = true;
        } else {
          state!.isOpen = false;
        }
      },
    }
  )
);
