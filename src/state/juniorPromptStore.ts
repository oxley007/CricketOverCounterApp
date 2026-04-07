import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      name: "junior-prompt-storage", // key in storage
    },
  ),
);
