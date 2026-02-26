// src/state/fixtureStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  completed: boolean;
};

interface FixtureState {
  fixtures: Fixture[];

  currentFixture?: Fixture;

  /* ========================
     Lifecycle
  ======================== */

  startFixture: () => void;

  getCurrentInningsNumber: () => number;

  saveCurrentInnings: () => void;

  completeFixture: () => void;

  clearCurrentFixture: () => void;

  deleteFixture: (fixtureId: string) => void;
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

        const inningsNumber = fixture.innings.length + 1;

        const snapshot: InningsSnapshot = {
          inningsNumber,

          battingTeamId: currentGame.battingTeamId,
          bowlingTeamId: currentGame.bowlingTeamId ?? "",

          matchEvents: [...events],
          battingEntries: [...currentGame.battingEntries],
          bowlers: [...currentGame.bowlers],

          totalRuns: currentGame.totalRuns,
          totalWickets: currentGame.wickets?.length ?? 0,
          totalBalls: currentGame.ballCount ?? 0,
        };

        set({
          currentFixture: {
            ...fixture,
            innings: [...fixture.innings, snapshot],
          },
        });

        console.log("✅ Innings saved:", inningsNumber);

        // 🔄 Reset live stores for next innings
        useMatchStore.getState().resetInnings();
        useGameStore.getState().resetGame();
      },

      /* ========================
         Complete Fixture
      ======================== */

      completeFixture: () => {
        const fixture = get().currentFixture;
        if (!fixture) return;

        const completedFixture: Fixture = {
          ...fixture,
          completed: true,
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

      partialize: (state) => ({
        fixtures: state.fixtures,
        currentFixture: state.currentFixture,
      }),

      version: 1,
    },
  ),
);
