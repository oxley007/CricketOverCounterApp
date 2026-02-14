// src/state/gameStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  ballsBowled: number; // legal balls only
  wides: number;
  noBalls: number;
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
  lastBowlerId?: string;
  explicitBowlerSelection?: boolean;
  wickets: WicketEvent[];
  ballCount: number;
};

export type WicketEvent = {
  batterId: string; // who got out
  bowlerId?: string; // bowler who took the wicket
  assistId?: string | null; // fielder who assisted (catch, stumping), null if none
  kind:
    | "bowled"
    | "caught"
    | "lbw"
    | "stumped"
    | "runOut"
    | "hitWicket"
    | "retired"
    | "partnership";
  runsConceded?: number; // optional, e.g., negative runs for scoring mode
  ballNumber: number; // sequential ball in the game
};

interface GameConfig {
  yourTeam: {
    id: string;
    name: string;
  };
  oppositionTeam: {
    id: string;
    name: string;
  };
  overs: number;
  season: string;
}

interface GameState {
  isSetupComplete: boolean;
  lastSeason?: string;
  seasons: string[];
  gameConfig?: GameConfig;
  currentGame?: CurrentGame;
  updateCurrentGame: (patch: Partial<CurrentGame>) => void;

  setSetupComplete: (value: boolean) => void;
  addSeason: (name: string) => void;
  setLastSeason: (name: string) => void;
  setGameConfig: (config: GameConfig) => void;

  startGame: (
    battingTeamId: string,
    bowlingTeamId: string,
    openingBatters?: string[],
  ) => void;
  addBatter: (playerId: string) => void;
  updateBatterStats: (playerId: string, runs: number, balls?: number) => void;
  setStrike: (playerId: string) => void;

  setBowlingTeam: (bowlingTeamId: string) => void;
  addBowler: (playerId: string) => void;
  setCurrentBowler: (playerId: string) => void;
  updateBowlerStats: (
    playerId: string,
    runsConceded: number,
    ballsBowled: number,
    wickets?: number,
  ) => void;

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

      updateCurrentGame: (patch: Partial<CurrentGame>) =>
        set((state) => ({
          currentGame: state.currentGame
            ? { ...state.currentGame, ...patch }
            : state.currentGame,
        })),

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

      startGame: (battingTeamId, bowlingTeamId, openingBatters = []) =>
        set({
          currentGame: {
            battingTeamId,
            bowlingTeamId, // ✅ persist this
            batters: openingBatters.map((id) => ({
              playerId: id,
              runs: 0,
              balls: 0,
            })),
            totalRuns: 0,
            totalBalls: 0,
            currentStrikeId: openingBatters[0],
            ballsThisOver: 0,
            bowlers: [],
            currentBowlerId: undefined,
            wickets: [], // ✅ initialize empty
            ballCount: 0,
          },
        }),

      addBatter: (playerId) =>
        set((state) => {
          if (!state.currentGame) return state;
          if (state.currentGame.batters.some((b) => b.playerId === playerId))
            return state;

          return {
            currentGame: {
              ...state.currentGame,
              batters: [
                ...state.currentGame.batters,
                { playerId, runs: 0, balls: 0 },
              ],
              currentStrikeId: state.currentGame.currentStrikeId ?? playerId,
            },
          };
        }),

      setBowlingTeam: (bowlingTeamId) =>
        set((state) =>
          state.currentGame
            ? { currentGame: { ...state.currentGame, bowlingTeamId } }
            : state,
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
                {
                  playerId,
                  wickets: 0,
                  runsConceded: 0,
                  ballsBowled: 0,
                  wides: 0,
                  noBalls: 0,
                },
              ],
              currentBowlerId: state.currentGame.currentBowlerId ?? playerId,
            },
          };
        }),

      setCurrentBowler: (playerId) =>
        set((state) =>
          state.currentGame
            ? {
                currentGame: {
                  ...state.currentGame,
                  currentBowlerId: playerId,
                },
              }
            : state,
        ),

      updateBowlerStats: (
        playerId,
        runsConceded,
        ballsBowled,
        wickets = 0,
        extraType?: "wide" | "noBall",
      ) =>
        set((state) => {
          if (!state.currentGame) return state;
          const list = state.currentGame.bowlers;
          if (!list.length) return state;

          const bowlers = list.map((b) => {
            if (b.playerId !== playerId) return b;

            let wides = b.wides;
            let noBalls = b.noBalls;
            let legalBalls = b.ballsBowled;

            if (extraType === "wide") {
              wides += 1;
            } else if (extraType === "noBall") {
              noBalls += 1;
            } else {
              legalBalls += ballsBowled; // counts only legal deliveries
            }

            return {
              ...b,
              runsConceded: b.runsConceded + runsConceded,
              ballsBowled: legalBalls,
              wickets: b.wickets + wickets,
              wides,
              noBalls,
            };
          });

          return { currentGame: { ...state.currentGame, bowlers } };
        }),

      updateBatterStats: (playerId, runs, balls = 1) =>
        set((state) => {
          if (!state.currentGame) return state;

          const batters = state.currentGame.batters.map((b) =>
            b.playerId === playerId
              ? { ...b, runs: b.runs + runs, balls: b.balls + balls }
              : b,
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
            : state,
        ),

      applyStrikeChange: (params) =>
        set((state) => {
          const game = state.currentGame;
          if (!game || !game.currentStrikeId) return state;

          // Update balls in the over
          let ballsThisOver = game.ballsThisOver;
          let ballCount = game.ballCount;

          if (params.countsAsBall) {
            ballsThisOver += 1;
            ballCount += 1; // ✅ increment overall ball count
          }

          const endsOver = params.countsAsBall && ballsThisOver >= LEGAL_BALLS;

          if (endsOver) {
            console.log(
              "OVER ENDED → saving lastBowlerId:",
              game.currentBowlerId,
            );
          }

          // Determine if strike should swap
          let shouldSwap = false;

          if (params.extraType === "wide" || params.extraType === "noBall") {
            // swap on even total runs for extras
            shouldSwap = params.runs % 2 === 0;
          } else if (
            params.extraType === "bye" ||
            params.extraType === "legBye"
          ) {
            // swap on **extras only**, not bat
            shouldSwap = params.extras % 2 === 1;
          } else {
            // normal runs
            shouldSwap = params.runs % 2 === 1;
          }

          // Always swap at the end of the over
          if (endsOver) {
            // If last ball and the normal strike-swap would happen on an odd run, cancel it
            const isOddSwap =
              (params.extraType === undefined && params.runs % 2 === 1) ||
              ((params.extraType === "bye" || params.extraType === "legBye") &&
                params.extras % 2 === 1);

            console.log(isOddSwap, "isOddSwap");

            if (isOddSwap) {
              console.log("hitting for odd?");
              shouldSwap = false; // prevent swap on last ball for odd runs
            } else {
              shouldSwap = true; // swap for all other end-of-over cases
            }
          }

          let currentStrikeId = game.currentStrikeId;
          if (shouldSwap && game.batters.length > 1) {
            const idx = game.batters.findIndex(
              (b) => b.playerId === currentStrikeId,
            );
            currentStrikeId =
              game.batters[(idx + 1) % game.batters.length].playerId;
          }

          return {
            currentGame: {
              ...game,
              currentStrikeId,
              ballsThisOver: endsOver ? 0 : ballsThisOver,

              // ✅ Save the bowler who just finished the over
              lastBowlerId: endsOver ? game.currentBowlerId : game.lastBowlerId,
              ballCount,
            },
          };
        }),

      addWicket: (
        batterId: string,
        bowlerId?: string,
        assistId?: string | null,
        kind: WicketEvent["kind"] = "bowled",
        runsConceded?: number,
      ) =>
        set((state) => {
          if (!state.currentGame) return state;

          const ballNumber = state.currentGame.ballCount + 1;
          const ballCount = ballNumber;

          return {
            currentGame: {
              ...state.currentGame,
              wickets: [
                ...(state.currentGame.wickets || []), // ✅ fallback here
                {
                  batterId,
                  bowlerId,
                  assistId: assistId ?? null,
                  kind,
                  runsConceded,
                  ballNumber,
                },
              ],
              ballCount,
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
            : state,
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
    },
  ),
);
