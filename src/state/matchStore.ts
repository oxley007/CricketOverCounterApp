import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

/* =========================
   Event Types
========================= */

export type ExtraType = "wide" | "noBall" | "bye" | "legBye" | "penalty";

export type RunBreakdown = {
  bat: number;     // runs off the bat
  extras: number;  // total extras for this ball
};

export type MatchEventBase = {
  id: string;
  timestamp: number;
  runs: number;
  runBreakdown: RunBreakdown;
  isExtra: boolean;
  extraType?: ExtraType;
  countsAsBall: boolean;
};

export type BallEvent = MatchEventBase & { type: "ball" };
export type WicketEvent = MatchEventBase & {
  type: "wicket";
  kind:
    | "bowled"
    | "caught"
    | "lbw"
    | "runOut"
    | "stumped"
    | "hitWicket"
    | "retired"
    | "partnership";
};

export type MatchEvent = BallEvent | WicketEvent;

/* =========================
   Store Interface
========================= */

interface MatchState {
  events: MatchEvent[];
  baseRuns: number;

  // rules
  wideIsExtraBall: boolean;
  wicketsAsNegativeRuns: boolean;
  wicketPenaltyRuns: number;

  // ball reminder
  ballReminderEnabled: boolean;
  ballReminderThresholdPercent: number;

  // UI
  showMatchRulesModal: boolean;
  openMatchRulesModal: () => void;
  closeMatchRulesModal: () => void;

  // IAP / subscription
  proUnlocked: boolean;
  setProUnlocked: (value: boolean) => void;

  // actions
  addEvent: (event: Omit<MatchEvent, "id" | "timestamp">) => void;
  undoLastEvent: () => void;
  resetInnings: () => void;
  setBaseRuns: (runs: number) => void;

  // setters
  setWideIsExtraBall: (value: boolean) => void;
  setWicketsAsNegativeRuns: (value: boolean) => void;
  setWicketPenaltyRuns: (value: number) => void;
  setBallReminderEnabled: (value: boolean) => void;
  setBallReminderThresholdPercent: (value: number) => void;
}

/* =========================
   Helpers
========================= */

const generateId = () => Math.random().toString(36).substring(2, 10);

const secureStore = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) =>
    SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

/* =========================
   Store
========================= */

export const matchStoreRef = create<MatchState>()(
  persist(
    (set, get) => ({
      // -------------------------
      // State
      // -------------------------
      events: [],
      baseRuns: 0,

      // rules
      wideIsExtraBall: true,
      wicketsAsNegativeRuns: false,
      wicketPenaltyRuns: 5,

      // ball reminder
      ballReminderEnabled: true,
      ballReminderThresholdPercent: 33,

      // UI
      showMatchRulesModal: false,

      // IAP
      proUnlocked: false,

      // -------------------------
      // Actions
      // -------------------------
      addEvent: (event) => {
        console.log("addEvent called with:", event); // 🟢 DEBUG
        const { wideIsExtraBall, wicketsAsNegativeRuns, wicketPenaltyRuns } =
          get();

          const countsAsBall = (() => {
            // explicit override always wins
            if (event.countsAsBall === false) return false;

            if (event.isExtra) {
              if (event.extraType === "wide") {
                return !wideIsExtraBall; // 👈 FIX
              }

              if (event.extraType === "noBall") {
                return false;
              }
            }

            return true;
          })();

        let batRuns = 0;
        let extraRuns = 0;

        // Auto-assign extras for wide/noBall
        // Auto-assign extras for extras-only taps
        // Auto-assign 1 run for extras that are not bat runs
        console.log("addEvent called with 2:", event); // 🟢 DEBUG
        if (event.isExtra) {
          if (event.extraType === "wide" || event.extraType === "noBall") {
            extraRuns = Math.max(extraRuns, 1); // wide/noBall always 1 extra min
          }

          // 🟢 For No Ball, include batRuns if runs > 1
          if (event.extraType === "noBall" && event.runs && event.runs > 1) {
            batRuns = event.runs - extraRuns;
          }

          if (event.extraType === "bye" || event.extraType === "legBye") {
            extraRuns = Math.max(extraRuns, 1); // bye/legBye always 1 extra min
          }
        }


        // Use user-provided runBreakdown if any
        if (event.runBreakdown) {
          batRuns = event.runBreakdown.bat ?? 0;
          extraRuns = Math.max(extraRuns, event.runBreakdown.extras ?? 0);
        }

        // Apply negative runs if enabled
        if (wicketsAsNegativeRuns) {
          const isNegativeWicket =
            event.type === "wicket" &&
            event.kind !== "partnership" &&
            event.kind !== "retired";

            const isNegativeBall =
              event.type === "ball" &&
              !event.isExtra &&
              !event.extraType &&
              (event.runs ?? 0) === 0;

          if (isNegativeWicket || isNegativeBall) {
            batRuns = -wicketPenaltyRuns;
            extraRuns = event.extraType === "wide" && !wideIsExtraBall ? 1 : 0;
          }
        }

        // Adjust batRuns to match total runs
        // Only do this if it's a normal ball (not bye/legBye/noBall/wide)
        if (
          event.type === "ball" &&
          event.runs !== undefined &&
          !event.runBreakdown &&
          !(event.isExtra && ["wide", "noBall", "bye", "legBye"].includes(event.extraType!))
        ) {
          batRuns = Math.max(0, event.runs - extraRuns);
        }

        const totalRuns = batRuns + extraRuns;

        const newEvent: MatchEvent = {
          ...event,
          id: generateId(),
          timestamp: Date.now(),
          countsAsBall,
          runs: totalRuns,
          runBreakdown: { bat: batRuns, extras: extraRuns },
          ...(event.type === "wicket" && { kind: (event as WicketEvent).kind }),
        } as MatchEvent;

        set((state) => ({ events: [...state.events, newEvent] }));
      },

      undoLastEvent: () =>
        set((state) => ({ events: state.events.slice(0, -1) })),

      resetInnings: () =>
        set({
          events: [],
          baseRuns: 0,
          showMatchRulesModal: true,
        }),

      setBaseRuns: (runs: number) =>
        set((state) => ({ ...state, baseRuns: Math.max(0, runs) })),

      openMatchRulesModal: () =>
        set({ showMatchRulesModal: true }),

      closeMatchRulesModal: () =>
        set({ showMatchRulesModal: false }),

      setWideIsExtraBall: (value: boolean) =>
        set((state) => ({ ...state, wideIsExtraBall: value })),

      setWicketsAsNegativeRuns: (value: boolean) =>
        set((state) => ({ ...state, wicketsAsNegativeRuns: value })),

      setWicketPenaltyRuns: (value: number) =>
        set((state) => ({ ...state, wicketPenaltyRuns: value })),

      setBallReminderEnabled: (value: boolean) =>
        set((state) => ({ ...state, ballReminderEnabled: value })),

      setBallReminderThresholdPercent: (value: number) =>
        set((state) => ({
          ...state,
          ballReminderThresholdPercent: Math.min(200, Math.max(0, value)),
        })),

      setProUnlocked: (value: boolean) =>
        set((state) => ({ ...state, proUnlocked: value })),
    }),
    {
      name: "cricket-match-events",
      storage: createJSONStorage(() => secureStore),

      partialize: (state) =>
        ({
          events: state.events ?? [],
          baseRuns: state.baseRuns,
          wideIsExtraBall: state.wideIsExtraBall,
          wicketsAsNegativeRuns: state.wicketsAsNegativeRuns,
          wicketPenaltyRuns: state.wicketPenaltyRuns,
          ballReminderEnabled: state.ballReminderEnabled,
          ballReminderThresholdPercent: state.ballReminderThresholdPercent,
          proUnlocked: state.proUnlocked,
        } as unknown as MatchState),
    }
  )
);

/* =========================
   Default Export
========================= */

export const useMatchStore = matchStoreRef;
