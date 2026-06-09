import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

/* =========================
   Event Types
========================= */

export type ExtraType =
  | "wide"
  | "noBall"
  | "bye"
  | "legBye"
  | "penalty";

export type MatchEventBase = {
  id: string;
  timestamp: number;
  runs: number; // can be negative
  isExtra: boolean;
  extraType?: ExtraType;
  countsAsBall: boolean;
};

export type BallEvent = MatchEventBase & {
  type: "ball";
};

export type WicketEvent = MatchEventBase & {
  type: "wicket";
  kind:
    | "bowled"
    | "caught"
    | "lbw"
    | "runOut"
    | "stumped"
    | "hitWicket"
    | "retired";
};

export type MatchEvent = BallEvent | WicketEvent;

/* =========================
   Store
========================= */

interface MatchState {
  // events
  events: MatchEvent[];

  // rules / settings
  wideIsExtraBall: boolean;
  wicketsAsNegativeRuns: boolean;
  wicketPenaltyRuns: number;

  // actions
  addEvent: (event: Omit<MatchEvent, "id" | "timestamp">) => void;
  undoLastEvent: () => void;
  resetInnings: () => void;

  // rule setters
  setWideIsExtraBall: (value: boolean) => void;
  setWicketsAsNegativeRuns: (value: boolean) => void;
  setWicketPenaltyRuns: (value: number) => void;

  // ball reminder settings
  ballReminderEnabled: boolean;
  ballReminderThresholdPercent: number;

  // setters
  setBallReminderEnabled: (value: boolean) => void;
  setBallReminderThresholdPercent: (value: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const secureStore = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) =>
    SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      /* -------------------------
         State
      ------------------------- */
      events: [],

      wideIsExtraBall: true,
      wicketsAsNegativeRuns: false,
      wicketPenaltyRuns: 5,
      ballReminderEnabled: true,
      ballReminderThresholdPercent: 33,

      /* -------------------------
         Actions
      ------------------------- */
      addEvent: (event) =>
        set((state) => {
          const isWide = event.extraType === "wide";
          const isNoBall = event.extraType === "noBall";

          const countsAsBall = !(
            event.isExtra &&
            (
              isNoBall ||
              (isWide && state.wideIsExtraBall === false)
            )
          );

          return {
            events: [
              ...state.events,
              {
                ...event,
                id: generateId(),
                timestamp: Date.now(),
                countsAsBall,
              },
            ],
          };
        }),

      undoLastEvent: () =>
        set((state) => ({
          events: state.events.slice(0, -1),
        })),

      resetInnings: () =>
        set({
          events: [],
        }),

      /* -------------------------
         Rule setters
      ------------------------- */
      setWideIsExtraBall: (value) =>
        set({ wideIsExtraBall: value }),

      setWicketsAsNegativeRuns: (value) =>
        set({ wicketsAsNegativeRuns: value }),

      setWicketPenaltyRuns: (value) =>
        set({ wicketPenaltyRuns: value }),

      setBallReminderEnabled: (value) =>
        set({ ballReminderEnabled: value }),

      setBallReminderThresholdPercent: (value) =>
        set({
          ballReminderThresholdPercent: Math.min(200, Math.max(0, value)),
        }),
    }),
    {
      name: "cricket-match-events",
      storage: createJSONStorage(() => secureStore),
    }
  )
);
