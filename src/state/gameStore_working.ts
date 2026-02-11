// src/state/gameStore.ts
import { create } from "zustand";
//import { useMatchStore } from "./matchStore";
import { matchStoreRef } from "./matchStore"; // adjust path if needed

const LEGAL_BALLS = 6;

// A batter in the current game
export type BatterStats = {
  playerId: string;
  runs: number;
  balls: number;
};

// Current game stats (per match)
export type CurrentGame = {
  battingTeamId: string;
  batters: BatterStats[];
  totalRuns: number;
  totalBalls: number;
  currentStrikeId?: string; // 🔹 Track who is on strike
  ballsThisOver: number;
};

interface GameConfig {
  yourTeam: string;
  oppositionTeam: string;
  overs: number;
  season: string;
}

interface GameState {
  isSetupComplete: boolean;
  lastSeason?: string;
  seasons: string[];
  gameConfig?: GameConfig;

  // ✅ New state for live game
  currentGame?: CurrentGame;

  // Existing setters
  setSetupComplete: (value: boolean) => void;
  addSeason: (name: string) => void;
  setLastSeason: (name: string) => void;
  setGameConfig: (config: GameConfig) => void;

  // ✅ New functions for batters
  startGame: (battingTeamId: string, openingBatters?: string[]) => void;
  addBatter: (playerId: string) => void; // add a batter to the current game
  updateBatterStats: (playerId: string, runs: number, balls?: number) => void; // update runs/balls
  setStrike: (playerId: string) => void;

  applyStrikeChange: (params: {
    bat: number;
    extras: number;
    countsAsBall: boolean;
    extraType?: "wide" | "noBall" | "bye" | "legBye" | "penalty";
    runs: number;
  }) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isSetupComplete: false,
  seasons: [],
  lastSeason: undefined,
  gameConfig: undefined,
  currentGame: undefined,

  setSetupComplete: (value) => set({ isSetupComplete: value }),
  addSeason: (name) => set((state) => ({ seasons: [...state.seasons, name] })),
  setLastSeason: (name) => set({ lastSeason: name }),
  setGameConfig: (config) => set({ gameConfig: config }),

  // In gameStore.ts
  resetGame: () => set({
    currentGame: undefined,
    isSetupComplete: false,
    gameConfig: undefined,
    lastSeason: undefined,
  }),

  setStrike: (playerId: string) =>
    set((state) => {
      if (!state.currentGame) return state;

      console.log("setStrike called with:", playerId); // 🔹 debug
      console.log("previous strike:", state.currentGame.currentStrikeId);

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          currentStrikeId: playerId,
        },
      };
    }),

  // 🔹 Initialize a new game
  // 🔹 startGame now takes openingBatters
  startGame: (battingTeamId: string, openingBatters: string[] = []) =>
    set({
      currentGame: {
        battingTeamId,
        batters: openingBatters.map((id) => ({
          playerId: id,
          runs: 0,
          balls: 0,
        })),
        totalRuns: 0,
        totalBalls: 0,
        currentStrikeId: openingBatters[0],
        ballsThisOver: 0,
      },
    }),

  // 🔹 Add a batter to current game
  addBatter: (playerId) =>
    set((state) => {
      if (!state.currentGame) return state;
      const exists = state.currentGame.batters.some((b) => b.playerId === playerId);
      if (exists) return state;

      const newBatter: BatterStats = { playerId, runs: 0, balls: 0 };

      console.log("Adding batter:", playerId);
      console.log("Current strike before adding:", state.currentGame?.currentStrikeId);


      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          batters: [...state.currentGame.batters, newBatter],
          // 🔹 If no currentStrikeId, set the first batter added as striker
          currentStrikeId: state.currentGame.currentStrikeId || playerId,
        },
      };
    }),

  // 🔹 Update batter runs/balls
  updateBatterStats: (playerId, runs, balls = 1) =>
    set((state) => {
      if (!state.currentGame) return state;

      const updatedBatters = state.currentGame.batters.map((b) =>
        b.playerId === playerId
          ? { ...b, runs: b.runs + runs, balls: b.balls + balls }
          : b
      );

      const totalRuns = updatedBatters.reduce((sum, b) => sum + b.runs, 0);
      const totalBalls = updatedBatters.reduce((sum, b) => sum + b.balls, 0);

      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          batters: updatedBatters,
          totalRuns,
          totalBalls,
        },
      };
    }),

    applyStrikeChange: ({ bat, extras, countsAsBall, extraType, runs }) =>
      set((state) => {
        const game = state.currentGame;
        if (!game || !game.currentStrikeId) return state;

        const { batters, currentStrikeId } = game;

        // ------------------------
        // 1️⃣ Update ballsThisOver
        // ------------------------
        let ballsThisOver = game.ballsThisOver;
        if (countsAsBall) ballsThisOver += 1;

        const endsOver = countsAsBall && ballsThisOver >= 6;

        // ------------------------
        // 2️⃣ Determine if strike should swap
        // ------------------------
        let shouldSwap = false;

        console.log(extraType, 'extraType check again');
        console.log(extras, 'extras check again');
        console.log(extras, 'runs check again');

        if (extraType === "wide" || extraType === "noBall") {
          // swap on even total runs for extras
          shouldSwap = runs % 2 === 0;
        } else if (extraType === "bye" || extraType === "legBye") {
          // swap on **extras only**, not bat
          shouldSwap = extras % 2 === 1;
        } else {
          // normal runs
          shouldSwap = runs % 2 === 1;
        }

        // ------------------------
        // End-of-over swap overrides
        // ------------------------
        console.log(endsOver, 'endsOver');

        if (endsOver) {
          // If last ball and the normal strike-swap would happen on an odd run, cancel it
          const isOddSwap =
            (extraType === undefined && runs % 2 === 1) ||
            ((extraType === "bye" || extraType === "legBye") && extras % 2 === 1);

            console.log(isOddSwap, 'isOddSwap');


          if (isOddSwap) {
            console.log('hitting for odd?');
            shouldSwap = false; // prevent swap on last ball for odd runs
          } else {
            shouldSwap = true; // swap for all other end-of-over cases
          }
        }

        // ------------------------
        // 3️⃣ Determine new strike
        // ------------------------
        let newStrikeId = currentStrikeId;

        if (batters.length > 1 && shouldSwap) {
          const strikerIndex = batters.findIndex((b) => b.playerId === currentStrikeId);
          if (strikerIndex !== -1) {
            newStrikeId = batters[(strikerIndex + 1) % batters.length].playerId;
          }
        }

        return {
          ...state,
          currentGame: {
            ...game,
            currentStrikeId: newStrikeId,
            ballsThisOver: endsOver ? 0 : ballsThisOver,
          },
        };
      }),

      // inside your useGameStore create function
      resetBatters: () =>
        set((state) => {
          if (!state.currentGame) return state;

          return {
            ...state,
            currentGame: {
              ...state.currentGame,
              batters: [],
              currentStrikeId: undefined,
            },
          };
        }),
}));
