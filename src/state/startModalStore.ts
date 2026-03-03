import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface StartModalState {
  isOpen: boolean; // tracks if modal is open
  selectedMode: "ballCounter" | "scorebook" | null;
  hasHydrated: boolean;

  open: () => void;
  close: () => void;
  selectBallCounter: () => void;
  selectScorebook: () => void;
  reset: () => void; // clears selectedMode and opens modal
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
      selectBallCounter: () =>
        set({ selectedMode: "ballCounter", isOpen: false }),
      selectScorebook: () => set({ selectedMode: "scorebook", isOpen: false }),

      reset: () =>
        set((state) => ({
          selectedMode: null,
        })),
    }),
    {
      name: "cricket-start-modal",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ selectedMode: s.selectedMode, isOpen: s.isOpen }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);

        // first launch: open modal if no selected mode
        if (!state?.selectedMode) {
          state?.open(); // use the store's open() method
        } else {
          state?.close(); // use the store's close() method
        }
      },
    },
  ),
);
