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
    | "retired"
    | "partnership";
};

export type MatchEvent = BallEvent | WicketEvent;

/* =========================
   Store
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

  // UI
  showMatchRulesModal: boolean;
  openMatchRulesModal: () => void;
  closeMatchRulesModal: () => void;

  // IAP / subscription
  proUnlocked: boolean;      // new
  setProUnlocked: (value: boolean) => void;
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

      /* -------------------------
         Actions
      ------------------------- */
      addEvent: (event) =>
      set((state) => {
          // ✅ get the current wideIsExtraBall setting from store
          const { wideIsExtraBall } = useMatchStore.getState();

          const countsAsBall =
            event.countsAsBall === false
              ? false
              : !(
                  event.isExtra &&
                  ((event.extraType === "wide" && !wideIsExtraBall) ||
                   (event.extraType === "noBall"))
                );

                // -----------------------------
                // Normalize runBreakdown
                // -----------------------------
                let batRuns = 0;
                let extraRuns = 0;

                // 1️⃣ Auto-assign extras for wide/noBall
                if (event.isExtra && (event.extraType === "wide" || event.extraType === "noBall")) {
                  extraRuns = 1;
                }

                // 2️⃣ Use user-provided runBreakdown if any
                if (event.runBreakdown) {
                  batRuns = event.runBreakdown.bat ?? 0;   // <-- no Math.max here
                  extraRuns = Math.max(extraRuns, event.runBreakdown.extras ?? 0);
                }

                // 3️⃣ Apply negative runs if 'wicketsAsNegativeRuns' is true
                if (useMatchStore.getState().wicketsAsNegativeRuns) {
                  if (event.type === "wicket") {
                    batRuns = -useMatchStore.getState().wicketPenaltyRuns;
                    extraRuns = 0;
                  } else if (event.type === "ball") {
                    // apply negative runs to a normal ball
                    batRuns = -useMatchStore.getState().wicketPenaltyRuns;
                    extraRuns = 0;
                  }
                }

                // 4️⃣ Adjust batRuns to match total runs for normal balls only
                if (event.type === "ball" && event.runs !== undefined && !event.runBreakdown) {
                  batRuns = Math.max(0, event.runs - extraRuns);
                }

                const totalRuns = batRuns + extraRuns;

          // -----------------------------
          // DEBUG LOG BEFORE ADDING
          // -----------------------------
          const newEvent = {
            ...event,
            id: generateId(),
            timestamp: Date.now(),
            countsAsBall,
            runs: totalRuns,
            runBreakdown: {
              bat: batRuns,
              extras: extraRuns,
            },
          };

          console.log("=== addEvent final stored event ===");
          console.log("Event type:", newEvent.type);
          console.log("Event kind:", (newEvent as WicketEvent).kind ?? "N/A");
          console.log("Stored runs:", newEvent.runs);
          console.log("Stored runBreakdown:", newEvent.runBreakdown);
          console.log("======================");

          return {
            events: [...state.events, newEvent],
          };
        }),

      undoLastEvent: () =>
        set((state) => ({
          events: state.events.slice(0, -1),
        })),

      resetInnings: () =>
        set({
          events: [],
          baseRuns: 0,
          showMatchRulesModal: true, // 👈 THIS IS THE KEY LINE
        }),

      setBaseRuns: (runs) =>
        set({
          baseRuns: Math.max(0, runs), // clamp if you want
        }),

      openMatchRulesModal: () =>
        set({ showMatchRulesModal: true }),

      closeMatchRulesModal: () =>
        set({ showMatchRulesModal: false }),

      /* -------------------------
         Setters
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
          ballReminderThresholdPercent: Math.min(
            200,
            Math.max(0, value)
          ),
        }),

      setProUnlocked: (value: boolean) => set({ proUnlocked: value }),

    }),
    {
      name: "cricket-match-events",
      storage: createJSONStorage(() => secureStore),

      // 🚫 prevent UI state from persisting
      partialize: (state) => ({
        events: state.events,
        baseRuns: state.baseRuns,
        wideIsExtraBall: state.wideIsExtraBall,
        wicketsAsNegativeRuns: state.wicketsAsNegativeRuns,
        wicketPenaltyRuns: state.wicketPenaltyRuns,
        ballReminderEnabled: state.ballReminderEnabled,
        ballReminderThresholdPercent:
          state.ballReminderThresholdPercent,
        proUnlocked: state.proUnlocked,
      }),
    }
  )
);
