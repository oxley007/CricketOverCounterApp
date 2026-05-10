import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LEGAL_BALLS, useGameStore } from "./gameStore";
import { useFixtureStore } from "./fixtureStore";
import {
  deleteLiveEvent,
  addLiveEvent,
  syncLiveGame,
} from "../services/firestoreService";

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

export type MatchEvent =
  | {
      id: string;
      timestamp: number;
      ballNumber: number;
      type: "ball";
      batterId?: string;
      batterInningId?: string;
      bowlerId?: string;
      runs: number;
      runBreakdown: {
        bat: number;
        extras: number;
      };
      countsAsBall: boolean;
      isExtra?: boolean;
      extraType?: "wide" | "noBall" | "bye" | "legBye";
      prevBatterId?: string;
      wicketPenaltyAdditionBatter?: number;
      wicketPenaltyAdditionBowler?: number;
      wicketPenaltyWicketType?: string;
    }
  | {
      id: string;
      timestamp: number;
      ballNumber: number;
      type: "wicket";
      batterId?: string;
      bowlerId?: string;
      kind?: string;
      runs: number;
      runBreakdown: {
        bat: number;
        extras: number;
      };
      countsAsBall: boolean;
      prevBatterId?: string;
      wicketPenaltyAdditionBatter?: number;
      wicketPenaltyAdditionBowler?: number;
      wicketPenaltyWicketType?: string;
    };

export interface MatchState {
  // -------------------------
  // State Properties
  // -------------------------
  liveTeamId?: string;
  events: MatchEvent[];
  baseRuns: number;
  wideIsExtraBall: boolean;
  wicketsAsNegativeRuns: boolean;
  wicketPenaltyRuns: number;
  wicketPenaltyAffectsBatter: boolean;
  wicketPenaltyAffectsBowler: boolean;
  autoSwapStrikeAfterWicket: boolean;
  wideExtraBallThreshold: number;
  ballReminderEnabled: boolean;
  ballReminderThresholdPercent: number;
  showMatchRulesModal: boolean;
  proUnlocked: boolean;
  proUnlockedScorebook: boolean;
  season: string;

  // -------------------------
  // Actions
  // -------------------------

  // Event Management
  addEvent: (event: Partial<MatchEvent> & { kind?: string }) => void;
  undoLastEvent: () => void;
  setMatchEvents: (events: MatchEvent[]) => void;
  getBallCount: () => number;
  reset: () => void;

  // Global / Sync
  setLiveTeamId: (id: string) => void;
  setSeason: (season: string) => void;
  setBaseRuns: (runs: number) => void;

  // UI Actions
  openMatchRulesModal: () => void;
  closeMatchRulesModal: () => void;

  // Rules & Settings
  setWideIsExtraBall: (value: boolean) => void;
  setWideExtraBallThreshold: (value: number) => void;
  setWicketsAsNegativeRuns: (value: boolean) => void;
  setWicketPenaltyRuns: (value: number) => void;
  setWicketPenaltyAffectsBatter: (value: boolean) => void;
  setWicketPenaltyAffectsBowler: (value: boolean) => void;
  setAutoSwapStrikeAfterWicket: (val: boolean) => void;
  setBallReminderEnabled: (value: boolean) => void;
  setBallReminderThresholdPercent: (value: number) => void;

  // IAP / Permissions
  setProUnlocked: (value: boolean) => void;
  setProUnlockedScorebook: (value: boolean) => void;
}

const initialState = {
  liveTeamId: undefined,
  events: [],
  baseRuns: 0,
  wideIsExtraBall: true,
  wicketsAsNegativeRuns: false,
  wicketPenaltyRuns: 5,
  wicketPenaltyAffectsBatter: false,
  wicketPenaltyAffectsBowler: false,
  autoSwapStrikeAfterWicket: true,
  wideExtraBallThreshold: 0,
  ballReminderEnabled: true,
  ballReminderThresholdPercent: 33,
  showMatchRulesModal: false,
  proUnlocked: false,
  proUnlockedScorebook: false,
  season: "",
};

export const matchStoreRef = create<MatchState>()(
  persist(
    (set, get) => ({
      // -------------------------
      // State
      // -------------------------
      events: [],
      baseRuns: 0,
      liveTeamId: undefined,
      season: "",

      // rules
      wideIsExtraBall: true,
      wicketsAsNegativeRuns: false,
      wicketPenaltyRuns: 5,

      wicketPenaltyAffectsBatter: false,
      wicketPenaltyAffectsBowler: false,

      autoSwapStrikeAfterWicket: true,

      // in matchStoreRef initial state
      wideExtraBallThreshold: 0,

      // ball reminder
      ballReminderEnabled: true,
      ballReminderThresholdPercent: 33,

      // UI
      showMatchRulesModal: false,

      // IAP
      proUnlocked: false,
      proUnlockedScorebook: false,

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

        /*
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
        */

        if (wicketsAsNegativeRuns) {
          const isNegativeWicket =
            event.type === "wicket" &&
            event.kind !== "partnership" &&
            event.kind !== "retired";

          if (isNegativeWicket) {
            batRuns = -wicketPenaltyRuns;
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

        const gameSnapshot = useGameStore.getState().currentGame;

        const newEvent: MatchEvent = {
          ...event,
          id: generateId(),
          timestamp: Date.now(),
          ballNumber: get().events.length + 1,
          countsAsBall,
          runs: totalRuns,
          runBreakdown: { bat: batRuns, extras: extraRuns },
          prevBatterId:
            event.prevBatterId ??
            gameSnapshot?.currentStrikeId ??
            gameSnapshot?.activeBatters[0]?.playerId,
          ...(event.type === "wicket" && { kind: (event as WicketEvent).kind }),
        } as MatchEvent;

        set((state) => ({ events: [...state.events, newEvent] }));

        const { liveTeamId } = get();

        if (liveTeamId) {
          addLiveEvent(liveTeamId, newEvent).catch((e) =>
            console.warn("⚠️ Failed to sync live event:", e),
          );
        }

        const { updateBatterStats, updateBowlerStats, currentGame, setStrike } =
          useGameStore.getState();

        // ✅ Update batter if exists
        // ✅ Update batter + batting entry
        /*
        if (newEvent.batterId && currentGame && newEvent.type === "ball") {
          updateBatterStats(
            newEvent.batterId,
            newEvent.runBreakdown.bat,
            newEvent.countsAsBall ? 1 : 0,
          );

          const { currentGame, updateBattingEntryStats } =
            useGameStore.getState();

          if (currentGame && newEvent.batterId) {
            const active = currentGame.activeBatters.find(
              (b) => b.playerId === newEvent.batterId,
            );

            if (active?.batterInningId) {
              updateBattingEntryStats(
                active.batterInningId,
                newEvent.runBreakdown.bat,
                newEvent.countsAsBall ? 1 : 0,
              );
            }
          }

          setStrike(newEvent.batterId);
        }
        */

        if (
          newEvent.batterId &&
          newEvent.batterInningId &&
          currentGame &&
          newEvent.type === "ball"
        ) {
          updateBatterStats(
            newEvent.batterId,
            newEvent.runBreakdown.bat,
            newEvent.countsAsBall ? 1 : 0,
          );

          const { updateBattingEntryStats } = useGameStore.getState();

          updateBattingEntryStats(
            newEvent.batterInningId,
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

        // after all updates (local + live sync + stats)
        const game = useGameStore.getState().currentGame;
        const fixture = useFixtureStore.getState().currentFixture;

        if (game && fixture?.yourTeam?.id) {
          syncLiveGame(fixture.yourTeam.id, game);
        }
      },

      setLiveTeamId: (id: string) => set({ liveTeamId: id }),

      undoLastEvent: () =>
        set((state) => {
          if (state.events.length === 0) return state;

          const lastEvent = state.events[state.events.length - 1];

          // 🚫 Block wicket undo
          if (lastEvent.type === "wicket") {
            Alert.alert("Undo Not Allowed", "You cannot undo after a wicket.");
            return state;
          }

          const updatedEvents = state.events.slice(0, -1);
          const gameStore = useGameStore.getState();
          const game = gameStore.currentGame;

          console.log("UNDO LAST EVENT:", lastEvent);

          if (!game) return { events: updatedEvents };

          console.log("CURRENT GAME BEFORE UNDO:", {
            ballCount: game.ballCount,
            ballsThisOver: game.ballCount % LEGAL_BALLS,
            currentBowlerId: game.currentBowlerId,
            lastBowlerId: game.lastBowlerId,
            activeBatters: game.activeBatters,
            activeRetired: game.activeRetired,
          });

          const { batterId, bowlerId, runBreakdown, countsAsBall, extraType } =
            lastEvent;
          const bat = runBreakdown?.bat ?? 0;
          const extras = runBreakdown?.extras ?? 0;

          // 1️⃣ Reverse batter stats
          if (bat > 0 || countsAsBall) {
            gameStore.updateBatterStats(batterId, -bat, countsAsBall ? -1 : 0);
          }

          // 2️⃣ Reverse bowler stats
          if (bowlerId) {
            gameStore.updateBowlerStats(
              bowlerId,
              -(bat + extras),
              countsAsBall ? -1 : 0,
              0,
              extraType as "wide" | "noBall" | undefined,
            );
          }

          // 3️⃣ Restore previous strike
          if (lastEvent.prevBatterId) {
            gameStore.setStrike(lastEvent.prevBatterId);
          }

          // 4️⃣ RESTORE bowler if needed
          if (bowlerId && countsAsBall && game.lastBowlerPerOver) {
            // decrement ball count first
            gameStore.decrementBallCount?.();

            const newBallCount = gameStore.currentGame?.ballCount ?? 0;
            const overIndex = Math.floor((newBallCount - 1) / LEGAL_BALLS); // last completed over

            const previousBowlerId =
              gameStore.currentGame?.lastBowlerPerOver?.[overIndex];

            console.log("Undo ball count before restore:", newBallCount);
            console.log("Over index for previous bowler:", overIndex);
            console.log(
              "Previous bowler for last completed over:",
              previousBowlerId,
            );

            if (previousBowlerId && !game.explicitBowlerSelection) {
              console.log("Undo: restoring previous bowler", previousBowlerId);
              gameStore.setCurrentBowler(previousBowlerId);
            }
          }

          console.log("GAME STATE AFTER UNDO:", {
            currentBowlerId: gameStore.currentGame?.currentBowlerId,
            lastBowlerId: gameStore.currentGame?.lastBowlerId,
            ballCount: gameStore.currentGame?.ballCount,
          });

          console.log(
            "Was end of over (after undo calculation):",
            (game.ballCount - 1) % LEGAL_BALLS === 0,
          );

          // ✅ Sync delete to Firebase (AFTER all logic)
          if (lastEvent && state.liveTeamId) {
            deleteLiveEvent(state.liveTeamId, lastEvent.id).catch((e) =>
              console.warn("⚠️ Failed to delete live event:", e),
            );
          }

          return { ...state, events: updatedEvents };
        }),

      resetInnings: () =>
        set({
          events: [],
          baseRuns: 0,
          showMatchRulesModal: false,
        }),

      resetInningsOnly: () =>
        set({
          events: [],
          showMatchRulesModal: false,
        }),

      setBaseRuns: (runs: number) =>
        set((state) => ({ ...state, baseRuns: Math.max(0, runs) })),

      setMatchEvents: (events: MatchEvent[]) => {
        set({ events });
      },

      // ✅ Add getter here
      getBallCount: () => {
        return get().events.filter((e) => e.type === "ball" && e.countsAsBall)
          .length;
      },

      openMatchRulesModal: () => set({ showMatchRulesModal: true }),

      closeMatchRulesModal: () => set({ showMatchRulesModal: false }),

      setWideIsExtraBall: (value: boolean) =>
        set((state) => ({ ...state, wideIsExtraBall: value })),

      setWideExtraBallThreshold: (value: number) =>
        set((state) => ({
          ...state,
          wideExtraBallThreshold: Math.max(0, value),
        })),

      setWicketsAsNegativeRuns: (value: boolean) =>
        set((state) => ({ ...state, wicketsAsNegativeRuns: value })),

      setWicketPenaltyRuns: (value: number) =>
        set((state) => ({ ...state, wicketPenaltyRuns: value })),

      setWicketPenaltyAffectsBatter: (value: boolean) =>
        set((state) => ({ ...state, wicketPenaltyAffectsBatter: value })),

      setWicketPenaltyAffectsBowler: (value: boolean) =>
        set((state) => ({ ...state, wicketPenaltyAffectsBowler: value })),

      setAutoSwapStrikeAfterWicket: (val: boolean) =>
        set({ autoSwapStrikeAfterWicket: val }),

      setBallReminderEnabled: (value: boolean) =>
        set((state) => ({ ...state, ballReminderEnabled: value })),

      setBallReminderThresholdPercent: (value: number) =>
        set((state) => ({
          ...state,
          ballReminderThresholdPercent: Math.min(200, Math.max(0, value)),
        })),

      setProUnlocked: (value: boolean) =>
        set((state) => ({ ...state, proUnlocked: value })),

      setProUnlockedScorebook: (value: boolean) =>
        set((state) => ({ ...state, proUnlockedScorebook: value })),

      reset: () => set(initialState),

      setSeason: (season: string) => set({ season }),
    }),
    {
      name: "cricket-match-events",
      storage: createJSONStorage(() => secureStore),
      partialize: (state) => ({
        events: state.events ?? [],
        baseRuns: state.baseRuns,
        liveTeamId: state.liveTeamId,
        wideIsExtraBall: state.wideIsExtraBall,
        wideExtraBallThreshold: state.wideExtraBallThreshold,
        wicketsAsNegativeRuns: state.wicketsAsNegativeRuns,
        wicketPenaltyRuns: state.wicketPenaltyRuns,
        wicketPenaltyAffectsBatter: state.wicketPenaltyAffectsBatter, // ✅ new
        wicketPenaltyAffectsBowler: state.wicketPenaltyAffectsBowler,
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
