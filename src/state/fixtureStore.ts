// src/state/fixtureStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { calculateFixtureResult } from "../utils/calculateFixtureResult";
import { generateId } from "../utils/generateId";
import { useGameStore, type BattingEntry, type BowlerStats } from "./gameStore";
import { useMatchStore, type MatchEvent } from "./matchStore";

/* =========================================================
   Types
========================================================= */

export type InningsSnapshot = {
  inningsNumber: number;

  battingTeamId: string;
  bowlingTeamId: string;

  matchEvents: MatchEvent[];

  battingEntries: BattingEntry[];
  bowlers: BowlerStats[];

  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
};

export type FixtureResultType =
  | "runs"
  | "wickets"
  | "innings"
  | "draw"
  | "abandoned";

export type FixtureResult = {
  type: FixtureResultType;

  teamTotals: Record<string, number>;

  winnerTeamId?: string;

  margin?: string;

  isDraw: boolean;
};

export type Fixture = {
  id: string;
  date: number;
  season?: string;

  yourTeam: {
    id: string;
    name: string;
  };

  oppositionTeam: {
    id: string;
    name: string;
  };

  overs: number;
  innings: InningsSnapshot[];
  abandoned?: boolean;
  result?: FixtureResult;
  completed: boolean;
};

interface FixtureState {
  fixtures: Fixture[];

  currentFixture?: Fixture;

  /* ========================
     Lifecycle
  ======================== */

  startFixture: () => void;
  addInnings: () => void;

  getCurrentInningsNumber: () => number;

  saveCurrentInnings: () => void;

  markFixtureAbandoned: () => void;

  completeFixture: () => void;

  clearCurrentFixture: () => void;

  deleteFixture: (fixtureId: string) => void;

  clearAllFixtures: () => void;
}

/* =========================================================
   Store
========================================================= */

export const useFixtureStore = create<FixtureState>()(
  persist(
    (set, get) => ({
      fixtures: [],
      currentFixture: undefined,

      /* ========================
         Start Fixture
      ======================== */

      startFixture: () => {
        const existing = get().currentFixture;

        if (existing && !existing.completed) {
          console.log("⚠️ Fixture already in progress");
          return;
        }

        const { gameConfig } = useGameStore.getState();

        if (!gameConfig) {
          console.log("⚠️ Cannot start fixture — no gameConfig found");
          return;
        }

        const newFixture: Fixture = {
          id: generateId(),
          date: Date.now(),
          season: gameConfig.season,

          yourTeam: gameConfig.yourTeam,
          oppositionTeam: gameConfig.oppositionTeam,

          overs: gameConfig.overs,

          innings: [],
          completed: false,
        };

        set({ currentFixture: newFixture });

        console.log("✅ Fixture started:", newFixture.id);
      },

      /* ========================
         Save Current Innings
      ======================== */

      saveCurrentInnings: () => {
        const fixture = get().currentFixture;
        if (!fixture) {
          console.log("⚠️ No current fixture to save innings into");
          return;
        }

        const { currentGame } = useGameStore.getState();
        const { events } = useMatchStore.getState();

        if (!currentGame) {
          console.log("⚠️ No current game found");
          return;
        }

        // ✅ Calculate totals from events (source of truth)
        const totalRuns = events.reduce(
          (sum, e) => (e.type === "ball" ? sum + (e.runs ?? 0) : sum),
          0,
        );
        const totalBalls = events.filter(
          (e) => e.type === "ball" && e.countsAsBall,
        ).length;
        const totalWickets = events.filter((e) => e.type === "wicket").length;

        const snapshot: InningsSnapshot = {
          inningsNumber: 0, // placeholder, we’ll set it below
          battingTeamId: currentGame.battingTeamId,
          bowlingTeamId: currentGame.bowlingTeamId ?? "",
          matchEvents: [...events],
          battingEntries: [...currentGame.battingEntries],
          bowlers: [],
          totalRuns,
          totalWickets,
          totalBalls,
        };

        // 🔍 Look for an empty innings
        const emptyIndex = fixture.innings.findIndex(
          (inn) => !inn.battingTeamId,
        );

        let updatedInnings;
        if (emptyIndex !== -1) {
          // Replace the first empty innings
          snapshot.inningsNumber = emptyIndex + 1;
          updatedInnings = [...fixture.innings];
          updatedInnings[emptyIndex] = snapshot;
          console.log(
            `♻️ Saved innings into existing empty slot ${emptyIndex + 1}`,
          );
        } else {
          // No empty innings → append
          snapshot.inningsNumber = fixture.innings.length + 1;
          updatedInnings = [...fixture.innings, snapshot];
          console.log(`✅ Saved innings as new ${snapshot.inningsNumber}`);
        }

        set({
          currentFixture: {
            ...fixture,
            innings: updatedInnings,
          },
        });

        // 🔄 Reset live stores for next innings
        useMatchStore.getState().resetInnings();
        useGameStore.getState().resetGame();
      },

      getCurrentInningsNumber: () => {
        const fixture = get().currentFixture;
        return fixture?.innings.length ?? 0;
      },

      addInnings: () => {
        const fixture = get().currentFixture;
        if (!fixture) {
          console.warn("⚠️ No fixture in progress to add innings to");
          return;
        }

        // 1️⃣ Try to find an empty innings
        const emptyInningsIndex = fixture.innings.findIndex(
          (inn) => !inn.battingTeamId,
        );

        if (emptyInningsIndex !== -1) {
          // reuse existing empty innings
          const battingTeamId =
            (emptyInningsIndex + 1) % 2 === 1
              ? fixture.yourTeam.id
              : fixture.oppositionTeam.id;
          const bowlingTeamId =
            (emptyInningsIndex + 1) % 2 === 1
              ? fixture.oppositionTeam.id
              : fixture.yourTeam.id;

          const updatedInnings = [...fixture.innings];
          updatedInnings[emptyInningsIndex] = {
            ...updatedInnings[emptyInningsIndex],
            inningsNumber: emptyInningsIndex + 1,
            battingTeamId,
            bowlingTeamId,
            matchEvents: [],
            battingEntries: [],
            bowlers: [],
            totalRuns: 0,
            totalWickets: 0,
            totalBalls: 0,
          };

          set({
            currentFixture: {
              ...fixture,
              innings: updatedInnings,
            },
          });

          console.log(
            `♻️ Reused empty innings at position ${emptyInningsIndex + 1}`,
          );
          return;
        }

        // 2️⃣ No empty innings? append new
        const inningsNumber = fixture.innings.length + 1;
        const battingTeamId =
          inningsNumber % 2 === 1
            ? fixture.yourTeam.id
            : fixture.oppositionTeam.id;
        const bowlingTeamId =
          inningsNumber % 2 === 1
            ? fixture.oppositionTeam.id
            : fixture.yourTeam.id;

        const newInnings: InningsSnapshot = {
          inningsNumber,
          battingTeamId,
          bowlingTeamId,
          matchEvents: [],
          battingEntries: [],
          bowlers: [],
          totalRuns: 0,
          totalWickets: 0,
          totalBalls: 0,
        };

        set({
          currentFixture: {
            ...fixture,
            innings: [...fixture.innings, newInnings],
          },
        });

        console.log(`✅ Added new innings: ${inningsNumber}`);
      },

      markFixtureAbandoned: () => {
        const fixture = get().currentFixture;
        if (!fixture) return;

        const result = calculateFixtureResult({
          ...fixture,
          abandoned: true,
        });

        const updatedFixture: Fixture = {
          ...fixture,
          completed: true,
          abandoned: true,
          result,
        };

        set((state) => ({
          fixtures: [...state.fixtures, updatedFixture],
          currentFixture: undefined,
        }));
      },

      /* ========================
         Complete Fixture
      ======================== */

      completeFixture: () => {
        const fixture = get().currentFixture;
        if (!fixture) return;

        const result = calculateFixtureResult(fixture);

        const completedFixture: Fixture = {
          ...fixture,
          completed: true,
          result,
        };

        set((state) => ({
          fixtures: [...state.fixtures, completedFixture],
          currentFixture: undefined,
        }));

        console.log("🏁 Fixture completed:", completedFixture.id);
      },

      /* ========================
         Clear Current Fixture
      ======================== */

      clearCurrentFixture: () => {
        set({ currentFixture: undefined });
      },

      /* ========================
   Clear ALL Fixtures (DEV)
======================== */

      clearAllFixtures: () => {
        set({
          fixtures: [],
          currentFixture: undefined,
        });
        console.log("🧨 All fixtures cleared");
      },

      /* ========================
         Delete Fixture
      ======================== */

      deleteFixture: (fixtureId: string) =>
        set((state) => ({
          fixtures: state.fixtures.filter((f) => f.id !== fixtureId),
        })),
    }),
    {
      name: "cricket-fixtures",
      storage: createJSONStorage(() => AsyncStorage),

      // normalize old fixtures
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (state.fixtures) {
          state.fixtures = state.fixtures.map((f) => ({
            ...f,
            innings: Array.isArray(f.innings) ? f.innings : [],
          }));
        }

        if (state.currentFixture) {
          state.currentFixture = {
            ...state.currentFixture,
            innings: Array.isArray(state.currentFixture.innings)
              ? state.currentFixture.innings
              : [],
          };
        }
      },

      partialize: (state) => ({
        fixtures: state.fixtures,
        currentFixture: state.currentFixture,
      }),
      version: 1,
    },
  ),
);
