// src/state/fixtureStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { calculateFixtureResult } from "../utils/calculateFixtureResult";
import { generateId } from "../utils/generateId";
import { useGameStore, type BattingEntry, type BowlerStats } from "./gameStore";
import { useMatchStore, type MatchEvent } from "./matchStore";
import { useStartModalStore } from "./startModalStore";

import { saveLiveFixture, updateLiveData } from "../services/firestoreService";

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

  isPlaceholder?: boolean;
};

/* =========================================================
   Helpers
========================================================= */

const isEmptyInnings = (inn: InningsSnapshot) => inn.isPlaceholder === true;

/* =========================================================
   Store
========================================================= */

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

  battingTeamId?: string;
  bowlingTeamId?: string;

  overs: number;
  innings: InningsSnapshot[];
  abandoned?: boolean;
  result?: FixtureResult;
  completed: boolean;
  mode?: "ballcounter" | "scorebook";
};

interface FixtureState {
  fixtures: Fixture[];

  currentFixture?: Fixture;

  /* ========================
     Lifecycle
  ======================== */

  startFixture: () => void;
  addInnings: () => void;

  setCurrentFixture: (fixture: Fixture) => void;

  getCurrentInningsNumber: () => number;

  saveCurrentInnings: () => void;

  markFixtureAbandoned: () => void;

  completeFixture: () => void;

  upsertFixture: (incoming: Fixture) => void;

  clearCurrentFixture: () => void;

  deleteFixture: (fixtureId: string) => void;

  clearAllFixtures: () => void;
}

const initialState = {
  fixtures: [],
  currentFixture: undefined,
};

/* =========================================================
   Store
========================================================= */

export const useFixtureStore = create<FixtureState>()(
  persist(
    (set, get) => ({
      fixtures: [],
      currentFixture: undefined,

      setCurrentFixture: (fixture) => {
        set({ currentFixture: fixture });
      },

      /* ========================
         Start Fixture
      ======================== */

      startFixture: async () => {
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
        const { selectedMode } = useStartModalStore.getState();

        // ✅ OPTIONAL: create initial live fixture doc
        try {
          await saveLiveFixture(gameConfig.yourTeam.id, {
            ...newFixture,
            status: "live",
          });

          /*
          await updateLiveData(gameConfig.yourTeam.id, {
            fixtureId: newFixture.id,
            mode: selectedMode,
          });
          */

          await updateLiveData(gameConfig.yourTeam.id, {
            ...newFixture,
            fixtureId: newFixture.id,
            mode: selectedMode,
          });
        } catch (err) {
          console.warn("⚠️ Failed to create live fixture:", err);
        }
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
        const { events, baseRuns } = useMatchStore.getState();

        if (!currentGame) {
          console.log("⚠️ No current game found");
          return;
        }

        // ✅ Calculate totals from events (source of truth)
        const totalRuns =
          baseRuns + events.reduce((sum, e) => sum + (e.runs ?? 0), 0);
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
          isPlaceholder: false,
        };

        // 🔍 Look for an empty innings
        const emptyIndex = fixture.innings.findIndex(isEmptyInnings);

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

        // 🔥 ADD IT HERE
        const updatedFixture = { ...fixture, innings: updatedInnings };

        console.log(JSON.stringify(updatedFixture), "updatedFixture is>?");

        // We use a self-invoking async block because saveCurrentInnings isn't async
        (async () => {
          try {
            await updateLiveData(updatedFixture.yourTeam.id, {
              ...updatedFixture,
              status: "live",
              // You can add more live-specific flags here
            });
            console.log("📡 Live Data updated with new innings");
          } catch (err) {
            console.warn("⚠️ Sync to Live Data failed:", err);
          }
        })();

        // 🔄 Reset live stores for next innings
        useMatchStore.getState().resetInnings();
        useGameStore.getState().resetGame();
      },

      getCurrentInningsNumber: () => {
        const fixture = get().currentFixture;
        return fixture?.innings.length ?? 0;
      },

      addInnings: async () => {
        const fixture = get().currentFixture;
        if (!fixture) {
          console.warn("⚠️ No fixture in progress to add innings to");
          return;
        }

        const teamId = useMatchStore.getState().liveTeamId;

        // 1️⃣ Try to find an empty innings
        const emptyInningsIndex = fixture.innings.findIndex(isEmptyInnings);

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

          // ✅ 3. create updated fixture FIRST
          const updatedFixture = {
            ...fixture,
            innings: updatedInnings,
          };

          // ✅ 4. set it
          set({ currentFixture: updatedFixture });

          console.log(
            `♻️ Reused empty innings at position ${emptyInningsIndex + 1}`,
          );

          // ✅ 5. save to Firebase
          try {
            await saveLiveFixture(teamId, updatedFixture);
          } catch (err) {
            console.warn("⚠️ Failed to sync live fixture:", err);
          }

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
          isPlaceholder: true,
        };

        // ✅ 3. create updated fixture
        const updatedFixture = {
          ...fixture,
          innings: [...fixture.innings, newInnings],
        };

        // ✅ 4. set it
        set({
          currentFixture: updatedFixture,
        });

        console.log(`✅ Added new innings: ${inningsNumber}`);

        // ✅ 5. save to Firebase
        try {
          await saveLiveFixture(teamId, updatedFixture);
        } catch (err) {
          console.warn("⚠️ Failed to sync live fixture:", err);
        }
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

      completeFixture: async () => {
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

        // ✅ NEW: save to public live collection
        try {
          await saveLiveFixture(
            completedFixture.yourTeam.id, // or whichever team owns live
            completedFixture,
          );
        } catch (err) {
          console.warn("⚠️ Failed to save live fixture:", err);
        }
      },

      // Inside useFixtureStore actions...

      upsertFixture: (incoming: Fixture) => {
        set((state) => {
          // 1. If it's the one we are currently scoring, only update that
          if (state.currentFixture?.id === incoming.id) {
            return { currentFixture: { ...state.currentFixture, ...incoming } };
          }

          // 2. Otherwise, update or add to the history list
          const index = state.fixtures.findIndex((f) => f.id === incoming.id);
          if (index > -1) {
            const updatedFixtures = [...state.fixtures];
            updatedFixtures[index] = { ...updatedFixtures[index], ...incoming };
            return { fixtures: updatedFixtures };
          }

          return { fixtures: [incoming, ...state.fixtures] };
        });
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

      reset: () => set(initialState),
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
