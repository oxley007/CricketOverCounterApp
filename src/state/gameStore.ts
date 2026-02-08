// src/state/gameStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LEGAL_BALLS = 6;

export type BatterStats = {
  playerId: string;
  runs: number;
  balls: number;
};

export type BowlerStats = {
  playerId: string;
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
};

export type CurrentGame = {
  battingTeamId: string;
  batters: BatterStats[];
  totalRuns: number;
  totalBalls: number;
  currentStrikeId?: string;
  ballsThisOver: number;
  /** Bowling team and bowlers (scorebook mode) */
  bowlingTeamId?: string;
  bowlers: BowlerStats[];
  currentBowlerId?: string;
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
  currentGame?: CurrentGame;

  setSetupComplete: (value: boolean) => void;
  addSeason: (name: string) => void;
  setLastSeason: (name: string) => void;
  setGameConfig: (config: GameConfig) => void;

  startGame: (battingTeamId: string, openingBatters?: string[]) => void;
  addBatter: (playerId: string) => void;
  updateBatterStats: (playerId: string, runs: number, balls?: number) => void;
  setStrike: (playerId: string) => void;

  setBowlingTeam: (bowlingTeamId: string) => void;
  addBowler: (playerId: string) => void;
  setCurrentBowler: (playerId: string) => void;
  updateBowlerStats: (playerId: string, runsConceded: number, ballsBowled: number, wickets?: number) => void;

  applyStrikeChange: (params: {
    bat: number;
    extras: number;
    countsAsBall: boolean;
    extraType?: "wide" | "noBall" | "bye" | "legBye" | "penalty";
    runs: number;
  }) => void;

  resetGame: () => void;
  resetBatters: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      isSetupComplete: false,
      seasons: [],
      lastSeason: undefined,
      gameConfig: undefined,
      currentGame: undefined,

      setSetupComplete: (value) => set({ isSetupComplete: value }),
      addSeason: (name) =>
        set((state) => ({ seasons: [...state.seasons, name] })),
      setLastSeason: (name) => set({ lastSeason: name }),
      setGameConfig: (config) => set({ gameConfig: config }),

      resetGame: () =>
        set({
          currentGame: undefined,
          isSetupComplete: false,
          gameConfig: undefined,
          lastSeason: undefined,
        }),

        startGame: (battingTeamId, openingBatters = []) =>
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
              bowlingTeamId: undefined,
              bowlers: [],
              currentBowlerId: undefined,
            },
          }),

      addBatter: (playerId) =>
        set((state) => {
          if (!state.currentGame) return state;
          if (state.currentGame.batters.some(b => b.playerId === playerId))
            return state;

          return {
            currentGame: {
              ...state.currentGame,
              batters: [
                ...state.currentGame.batters,
                { playerId, runs: 0, balls: 0 },
              ],
              currentStrikeId:
                state.currentGame.currentStrikeId ?? playerId,
            },
          };
        }),

      setBowlingTeam: (bowlingTeamId) =>
        set((state) =>
          state.currentGame
            ? { currentGame: { ...state.currentGame, bowlingTeamId } }
            : state
        ),

      addBowler: (playerId) =>
        set((state) => {
          if (!state.currentGame) return state;
          if (state.currentGame.bowlers.some((b) => b.playerId === playerId))
            return state;
          return {
            currentGame: {
              ...state.currentGame,
              bowlers: [
                ...state.currentGame.bowlers,
                { playerId, wickets: 0, runsConceded: 0, ballsBowled: 0 },
              ],
              currentBowlerId: state.currentGame.currentBowlerId ?? playerId,
            },
          };
        }),

      setCurrentBowler: (playerId) =>
        set((state) =>
          state.currentGame
            ? { currentGame: { ...state.currentGame, currentBowlerId: playerId } }
            : state
        ),

      updateBowlerStats: (playerId, runsConceded, ballsBowled, wickets = 0) =>
        set((state) => {
          if (!state.currentGame) return state;
          const list = state.currentGame.bowlers;
          if (!list.length) return state;
          const bowlers = list.map((b) =>
            b.playerId === playerId
              ? {
                  ...b,
                  runsConceded: b.runsConceded + runsConceded,
                  ballsBowled: b.ballsBowled + ballsBowled,
                  wickets: b.wickets + wickets,
                }
              : b
          );
          return {
            currentGame: { ...state.currentGame, bowlers },
          };
        }),

      updateBatterStats: (playerId, runs, balls = 1) =>
        set((state) => {
          if (!state.currentGame) return state;

          const batters = state.currentGame.batters.map((b) =>
            b.playerId === playerId
              ? { ...b, runs: b.runs + runs, balls: b.balls + balls }
              : b
          );

          return {
            currentGame: {
              ...state.currentGame,
              batters,
              totalRuns: batters.reduce((s, b) => s + b.runs, 0),
              totalBalls: batters.reduce((s, b) => s + b.balls, 0),
            },
          };
        }),

      setStrike: (playerId) =>
        set((state) =>
          state.currentGame
            ? {
                currentGame: {
                  ...state.currentGame,
                  currentStrikeId: playerId,
                },
              }
            : state
        ),

      applyStrikeChange: (params) =>
        set((state) => {
          const game = state.currentGame;
          if (!game || !game.currentStrikeId) return state;

          let ballsThisOver = game.ballsThisOver;
          if (params.countsAsBall) ballsThisOver += 1;

          const endsOver = params.countsAsBall && ballsThisOver >= LEGAL_BALLS;

          let shouldSwap =
            params.extraType === "bye" || params.extraType === "legBye"
              ? params.extras % 2 === 1
              : params.runs % 2 === 1;

          if (endsOver) shouldSwap = !shouldSwap;

          let currentStrikeId = game.currentStrikeId;
          if (shouldSwap && game.batters.length > 1) {
            const idx = game.batters.findIndex(
              (b) => b.playerId === currentStrikeId
            );
            currentStrikeId =
              game.batters[(idx + 1) % game.batters.length].playerId;
          }

          return {
            currentGame: {
              ...game,
              currentStrikeId,
              ballsThisOver: endsOver ? 0 : ballsThisOver,
            },
          };
        }),

      resetBatters: () =>
        set((state) =>
          state.currentGame
            ? {
                currentGame: {
                  ...state.currentGame,
                  batters: [],
                  currentStrikeId: undefined,
                },
              }
            : state
        ),
    }),
    {
      name: "cricket-game-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSetupComplete: state.isSetupComplete,
        seasons: state.seasons,
        lastSeason: state.lastSeason,
        gameConfig: state.gameConfig,
        currentGame: state.currentGame,
      }),
      migrate: (persisted: unknown) => {
        const state = persisted as { currentGame?: CurrentGame };
        if (state?.currentGame && !Array.isArray(state.currentGame.bowlers)) {
          state.currentGame = { ...state.currentGame, bowlers: [] };
        }
        return state;
      },
      version: 1,
    }
  )
);
