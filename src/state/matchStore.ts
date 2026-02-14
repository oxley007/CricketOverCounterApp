import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useGameStore } from "./gameStore";

const secureStore = {
  getItem: async (name: string) => {
    const result = await SecureStore.getItemAsync(name);
    return result;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
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
        const { wideIsExtraBall, wicketsAsNegativeRuns, wicketPenaltyRuns } =
          get();

        const countsAsBall = (() => {
          if (event.countsAsBall === false) return false;
          if (event.isExtra) {
            if (event.extraType === "wide") return !wideIsExtraBall;
            if (event.extraType === "noBall") return false;
          }
          return true;
        })();

        let batRuns = 0;
        let extraRuns = 0;

        if (event.isExtra) {
          if (["wide", "noBall"].includes(event.extraType!))
            extraRuns = Math.max(extraRuns, 1);
          if (event.extraType === "noBall" && event.runs && event.runs > 1)
            batRuns = event.runs - extraRuns;
          if (
            ["bye", "legBye"].includes(event.extraType!) &&
            (!event.runs || event.runs === 0)
          )
            extraRuns = Math.max(extraRuns, 1);
        }

        if (event.runBreakdown) {
          batRuns = event.runBreakdown.bat ?? 0;
          extraRuns = Math.max(extraRuns, event.runBreakdown.extras ?? 0);
        }

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

        if (
          event.type === "ball" &&
          event.runs !== undefined &&
          !event.runBreakdown &&
          !(
            event.isExtra &&
            ["wide", "noBall", "bye", "legBye"].includes(event.extraType!)
          )
        ) {
          batRuns = Math.max(0, event.runs - extraRuns);
        }

        const totalRuns = batRuns + extraRuns;
        const generateId = () => Math.random().toString(36).substring(2, 12);

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

        const { updateBatterStats, updateBowlerStats, currentGame, setStrike } =
          useGameStore.getState();

        // ✅ Update batter if exists
        if (newEvent.batterId && currentGame && newEvent.type === "ball") {
          updateBatterStats(
            newEvent.batterId,
            newEvent.runBreakdown.bat,
            newEvent.countsAsBall ? 1 : 0,
          );
          setStrike(newEvent.batterId);
        }

        // ✅ Update bowler if exists
        if (newEvent.bowlerId) {
          if (newEvent.type === "ball") {
            updateBowlerStats(
              newEvent.bowlerId,
              newEvent.runs,
              newEvent.countsAsBall ? 1 : 0,
              0,
            );
          } else if (newEvent.type === "wicket") {
            updateBowlerStats(
              newEvent.bowlerId,
              newEvent.runs,
              newEvent.countsAsBall ? 1 : 0,
              1,
            );
          }
        }
      },

      undoLastEvent: () =>
        set((state) => {
          if (state.events.length === 0) return state;

          const lastEvent = state.events[state.events.length - 1];
          const newEvents = state.events.slice(0, -1);
          const {
            updateBatterStats,
            updateBowlerStats,
            currentGame,
            setStrike,
            setCurrentBowler,
          } = useGameStore.getState();

          if (!currentGame) return { ...state, events: newEvents };

          // Undo batter stats
          if (lastEvent.batterId && lastEvent.type === "ball") {
            updateBatterStats(
              lastEvent.batterId,
              -lastEvent.runBreakdown.bat,
              lastEvent.countsAsBall ? -1 : 0,
            );
            setStrike(lastEvent.batterId);
          }

          // Undo bowler stats
          if (lastEvent.bowlerId) {
            const extraType = lastEvent.extraType as
              | "wide"
              | "noBall"
              | undefined;
            if (lastEvent.type === "ball") {
              updateBowlerStats(
                lastEvent.bowlerId,
                -lastEvent.runs,
                lastEvent.countsAsBall ? -1 : 0,
                0,
                extraType,
              );
            } else if (lastEvent.type === "wicket") {
              updateBowlerStats(
                lastEvent.bowlerId,
                -lastEvent.runs,
                lastEvent.countsAsBall ? -1 : 0,
                -1,
                extraType,
              );
            }

            // If this was the last ball of an over and ballsThisOver is 0, restore bowler
            const ballsThisOver =
              lastEvent.countsAsBall && currentGame.ballsThisOver === 0
                ? LEGAL_BALLS - 1
                : currentGame.ballsThisOver - (lastEvent.countsAsBall ? 1 : 0);

            setCurrentBowler(lastEvent.bowlerId);

            // Update ballsThisOver
            set((s) => ({
              currentGame: s.currentGame
                ? { ...s.currentGame, ballsThisOver }
                : s.currentGame,
            }));
          }

          return { ...state, events: newEvents };
        }),

      resetInnings: () =>
        set({
          events: [],
          baseRuns: 0,
          showMatchRulesModal: false,
        }),

      setBaseRuns: (runs: number) =>
        set((state) => ({ ...state, baseRuns: Math.max(0, runs) })),

      // ✅ Add getter here
      getBallCount: () => {
        return get().events.filter((e) => e.type === "ball" && e.countsAsBall)
          .length;
      },

      openMatchRulesModal: () => set({ showMatchRulesModal: true }),

      closeMatchRulesModal: () => set({ showMatchRulesModal: false }),

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
      partialize: (state) => ({
        events: state.events ?? [],
        baseRuns: state.baseRuns,
        wideIsExtraBall: state.wideIsExtraBall,
        wicketsAsNegativeRuns: state.wicketsAsNegativeRuns,
        wicketPenaltyRuns: state.wicketPenaltyRuns,
        ballReminderEnabled: state.ballReminderEnabled,
        ballReminderThresholdPercent: state.ballReminderThresholdPercent,
        proUnlocked: state.proUnlocked,
      }),
    },
  ),
);

/* =========================
   Default Export
========================= */

export const useMatchStore = matchStoreRef;
