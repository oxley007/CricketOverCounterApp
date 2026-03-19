import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthState = {
  isGuest: boolean;
  guestMatchesPlayed: number;

  setGuest: (value: boolean) => void;
  incrementGuestMatches: () => void;
  resetGuestMatches: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isGuest: false,
      guestMatchesPlayed: 0,

      setGuest: (value) => set({ isGuest: value }),

      incrementGuestMatches: () =>
        set((state) => ({
          guestMatchesPlayed: state.guestMatchesPlayed + 1,
        })),

      resetGuestMatches: () =>
        set({
          guestMatchesPlayed: 0,
        }),
    }),
    {
      name: "auth-storage", // key in storage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
