import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface StartModalState {
  isOpen: boolean; // tracks if modal is open
  selectedMode: "ballCounter" | "scorebook" | null;
  hasHydrated: boolean;
  isSaving: boolean;

  open: () => void;
  close: () => void;
  selectBallCounter: () => void;
  selectScorebook: () => void;
  reset: () => void; // clears selectedMode and opens modal
  setHasHydrated: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
}

export const useStartModalStore = create<StartModalState>()(
  persist(
    (set) => ({
      isOpen: true,
      selectedMode: null,
      hasHydrated: false,
      isSaving: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setIsSaving: (v) => set({ isSaving: v }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      selectBallCounter: () =>
        set({ selectedMode: "ballCounter", isOpen: false }),
      selectScorebook: () => set({ selectedMode: "scorebook", isOpen: false }),

      reset: () =>
        set({
          selectedMode: null,
          isOpen: true,
          isSaving: false,
        }),
    }),
    {
      name: "cricket-start-modal",
      storage: createJSONStorage(() => AsyncStorage),
      // 🚀 CRITICAL FIX 1: Explicitly say what to save. Do NOT save isOpen.
      partialize: (s) => ({
        selectedMode: s.selectedMode,
      }),

      // 🚀 CRITICAL FIX 2: Explicitly force isOpen to be true on startup post-hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;

          // If no mode is selected yet, force the modal open on app start
          if (state.selectedMode === null) {
            state.isOpen = true;
          }
        }
      },
    },
  ),
);
