import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"; // Add createJSONStorage

type JuniorPromptState = {
  hasSeenPrompt: boolean;
  setHasSeenPrompt: (value: boolean) => void;
};

export const useJuniorPromptStore = create<JuniorPromptState>()(
  persist(
    (set) => ({
      hasSeenPrompt: false,
      setHasSeenPrompt: (value) => set({ hasSeenPrompt: value }),
    }),
    {
      name: "junior-prompt-storage",
      storage: createJSONStorage(() => AsyncStorage), // 👈 This is the missing bridge
    },
  ),
);
