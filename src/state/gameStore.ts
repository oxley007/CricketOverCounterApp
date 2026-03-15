// src/state/gameStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";
import { useMatchStore } from "./matchStore";

export const LEGAL_BALLS = 6;

export type BatterStats = {
  playerId: string;
  runs: number;
  balls: number;
  retired?: boolean;
};

export type BowlerStats = {
  playerId: string;
  wickets: number;
  runsConceded: number;
  ballsBowled: number; // legal balls only
  wides: number;
  noBalls: number;
};

export type BattingDismissal = {
  kind:
    | "bowled"
    | "caught"
    | "lbw"
    | "stumped"
    | "runOut"
    | "hitWicket"
    | "retired"
    | "notOut";
  bowlerId?: string;
};

export type BattingEntry = {
  entryId: string;
  playerId: string;
  inningsNumber: number; // allows batting twice
  battingOrder: number;
  runs: number;
  balls: number;
  dismissal?: BattingDismissal;
};

export type ActiveBatter = {
  playerId: string;
  batterInningId: string;
};

export type CurrentGame = {
  battingTeamId: string;
  activeBatters: ActiveBatter[];
  activeRetired: ActiveBatter[];
  battingEntries: BattingEntry[];

  currentStrikeId?: string;

  totalRuns: number;
  totalBalls: number;
  ballsThisOver: number;

  bowlingTeamId?: string;
  bowlers: BowlerStats[];
  currentBowlerId?: string;
  lastBowlerId?: string;
  lastBowlerPerOver: Record<number, string | undefined>;

  wickets: WicketEvent[];
  ballCount: number;
  currentEntryId?: string;
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
    extraType?: "wide" | "noBall",
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
  setCurrentBowlerExplicit: (playerId: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addWicket: (
    batterId: string,
    bowlerId?: string,
    assistId?: string | null,
    kind?: WicketEvent["kind"],
    runsConceded?: number,
  ) => void;

  addBattingEntry: (playerId: string) => void;
  retireBatter: (playerId: string) => void;

  updateBattingEntryStats: (
    entryId: string,
    runs: number,
    balls?: number,
  ) => void;

  dismissBattingEntry: (entryId: string, dismissal: BattingDismissal) => void;
  updateLastBowlerId: (bowlerId: string | null) => void;
  statsModalPlayerId: string | null;
  statsModalVisible: boolean;

  openStatsModal: (playerId: string) => void;
  closeStatsModal: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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
        set((state) => {
          // 🔴 GUARD: do not overwrite persisted game
          if (state.currentGame) {
            console.log("⚠️ startGame skipped — game already exists");
            return state;
          }

          console.log("✅ startGame creating new game");

          // startGame
          const battingEntries = openingBatters.map((id, index) => ({
            entryId: `${id}-${Date.now()}-${index}`, // string
            playerId: id,
            inningsNumber: 1,
            battingOrder: index + 1,
            runs: 0,
            balls: 0,
          }));

          const activeBatters = battingEntries.map((e) => ({
            playerId: e.playerId,
            batterInningId: e.entryId, // string
          }));

          const firstBatter = battingEntries[0];

          return {
            currentGame: {
              battingTeamId,
              bowlingTeamId,
              activeBatters: activeBatters,
              activeRetired: [],
              battingEntries,
              currentEntryId: battingEntries[0]?.entryId,
              currentStrikeId: firstBatter?.playerId,
              totalRuns: 0,
              totalBalls: 0,
              ballsThisOver: 0,
              bowlers: [],
              currentBowlerId: undefined,
              wickets: [],
              ballCount: 0,
            },
          };
        }),

      addBatter: (playerId: string): string | null => {
        let entryId: string | null = null;

        set((state) => {
          const game = state.currentGame;
          if (!game) return state;

          entryId = `${playerId}-${Date.now()}`;

          const entry = {
            entryId,
            playerId,
            inningsNumber:
              game.battingEntries.filter((e) => e.playerId === playerId)
                .length + 1,
            battingOrder: game.battingEntries.length + 1,
            runs: 0,
            balls: 0,
          };

          return {
            currentGame: {
              ...game,
              battingEntries: [...game.battingEntries, entry],
              currentEntryId: entryId,
              currentStrikeId: playerId,
            },
          };
        });

        return entryId;
      },

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

      resetBatters: () =>
        set((state) =>
          state.currentGame
            ? {
                currentGame: {
                  ...state.currentGame,
                  activeBatters: [],
                  activeRetired: [], // NEW
                  currentStrikeId: undefined,
                },
              }
            : state,
        ),

      setCurrentBowlerExplicit: (playerId: string) =>
        set((state) =>
          state.currentGame
            ? {
                currentGame: {
                  ...state.currentGame,
                  currentBowlerId: playerId,
                  explicitBowlerSelection: true,
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
          const game = state.currentGame;
          if (!game || !game.currentEntryId) return state;

          const battingEntries = game.battingEntries.map((e) =>
            e.entryId === game.currentEntryId
              ? { ...e, runs: e.runs + runs, balls: e.balls + balls }
              : e,
          );

          return {
            currentGame: {
              ...game,
              battingEntries,
              totalRuns: battingEntries.reduce((s, e) => s + e.runs, 0),
              totalBalls: battingEntries.reduce((s, e) => s + e.balls, 0),
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

          // 🔹 fetch events from matchStore
          const events = useMatchStore.getState().events;

          // Get actual balls bowled this over from events
          const { ballsThisOver: ballsThisOverFromEvents } =
            buildCurrentOverCircles(events || [], { wideIsExtraBall: true });

          // ✅ Increment for the current delivery only if it counts as a ball
          let ballsThisOver = ballsThisOverFromEvents;
          let ballCount = game.ballCount;

          /*
          if (params.countsAsBall) {
            ballsThisOver += 1; // current delivery
            ballCount += 1; // total balls in game
          }*/

          // Check if over ends
          const endsOver = ballsThisOver >= LEGAL_BALLS;

          // ----- LOGGING -----
          console.log("ballsThisOverFromEvents:", ballsThisOverFromEvents);
          console.log("ballsThisOver after increment:", ballsThisOver);
          console.log("ballCount total:", ballCount);

          if (endsOver) {
            console.log(
              "OVER ENDED → saving lastBowlerId:",
              game.currentBowlerId,
            );

            const overIndex = Math.floor(game.ballCount / LEGAL_BALLS);
            game.lastBowlerPerOver = {
              ...game.lastBowlerPerOver,
              [overIndex]: game.currentBowlerId,
            };

            // Reset explicit selection
            game.explicitBowlerSelection = false;
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
          if (shouldSwap && game.activeBatters.length > 1) {
            const idx = game.activeBatters.findIndex(
              (b) => b.playerId === currentStrikeId,
            );

            if (idx !== -1) {
              currentStrikeId =
                game.activeBatters[(idx + 1) % game.activeBatters.length]
                  .playerId;
            }
          }

          // ----- LOGGING -----
          console.log("=== APPLY STRIKE CHANGE ===");
          console.log("countsAsBall:", params.countsAsBall);
          console.log(
            "runs:",
            params.runs,
            "extras:",
            params.extras,
            "extraType:",
            params.extraType,
          );
          console.log("ballsThisOver (before update):", game.ballsThisOver);
          console.log("ballsThisOver (after update):", ballsThisOver);
          console.log("ballCount (total):", ballCount);
          console.log("endsOver:", endsOver);
          console.log("shouldSwap:", shouldSwap);
          console.log("currentStrikeId after change:", currentStrikeId);
          console.log("==========================");

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

      addBattingEntry: (playerId: string) =>
        set((state) => {
          const game = state.currentGame;
          if (!game) return state;

          const inningsCount =
            game.battingEntries.filter((e) => e.playerId === playerId).length +
            1;

          const entry = {
            entryId: `${playerId}-${Date.now()}`,
            playerId,
            inningsNumber: inningsCount,
            battingOrder: game.battingEntries.length + 1,
            runs: 0,
            balls: 0,
          };

          return {
            currentGame: {
              ...game,
              battingEntries: [...game.battingEntries, entry],
              currentEntryId: entry.entryId,
            },
          };
        }),

      retireBatter: (playerId: string) =>
        set((state) => {
          const game = state.currentGame;
          if (!game) return state;

          const activeBatters = game.activeBatters.filter(
            (b) => b.playerId !== playerId,
          );

          return {
            currentGame: {
              ...game,
              activeBatters,
              currentStrikeId:
                game.currentStrikeId === playerId
                  ? activeBatters[0]?.playerId
                  : game.currentStrikeId,
            },
          };
        }),

      updateBattingEntryStats: (entryId: string, runs: number, balls = 1) =>
        set((state) => {
          const game = state.currentGame;
          if (!game) return state;

          const battingEntries = game.battingEntries.map((e) =>
            e.entryId === entryId
              ? { ...e, runs: e.runs + runs, balls: e.balls + balls }
              : e,
          );

          return {
            currentGame: {
              ...game,
              battingEntries,
            },
          };
        }),

      dismissBattingEntry: (entryId: string, dismissal: BattingDismissal) =>
        set((state) => {
          const game = state.currentGame;
          if (!game) return state;

          const battingEntries = game.battingEntries.map((e) =>
            e.entryId === entryId ? { ...e, dismissal } : e,
          );

          return {
            currentGame: {
              ...game,
              battingEntries,
              currentEntryId: undefined,
            },
          };
        }),

      resetCurrentBowlerAfterUndo: () => {
        const game = get().currentGame;
        if (!game) return;

        const events = useMatchStore.getState().events || [];
        if (!events.length) return;

        // Find last ball that counts as a legal delivery
        const lastLegalBall = [...events]
          .reverse()
          .find((e) => e.countsAsBall && e.bowlerId);

        if (lastLegalBall && lastLegalBall.bowlerId) {
          console.log(
            "🔄 Resetting currentBowlerId after undo to:",
            lastLegalBall.bowlerId,
          );

          set({
            currentGame: {
              ...game,
              currentBowlerId: lastLegalBall.bowlerId,
            },
          });
        }
      },

      updateLastBowlerId: (bowlerId: string | null) =>
        set((state) => ({
          currentGame: {
            ...state.currentGame!,
            lastBowlerId: bowlerId,
          },
        })),

      statsModalPlayerId: null,
      statsModalVisible: false,

      openStatsModal: (playerId: string) =>
        set({ statsModalPlayerId: playerId, statsModalVisible: true }),
      closeStatsModal: () =>
        set({ statsModalPlayerId: null, statsModalVisible: false }),

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
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
      migrate: (persisted: any) => {
        if (!persisted) return persisted;

        const game = persisted.currentGame;

        if (!game) return persisted;

        const migratedGame = { ...game };

        if (
          Array.isArray(migratedGame.batters) &&
          !migratedGame.activeBatters
        ) {
          migratedGame.activeBatters = migratedGame.batters
            .filter((b: any) => !b.retired)
            .map((b: any) => b.playerId);
        }

        delete migratedGame.batters;

        if (!Array.isArray(migratedGame.bowlers)) {
          migratedGame.bowlers = [];
        }

        if (!Array.isArray(migratedGame.battingEntries)) {
          migratedGame.battingEntries = [];
        }

        if (!Array.isArray(migratedGame.activeRetired)) {
          migratedGame.activeRetired = [];
        }

        return {
          ...persisted,
          currentGame: migratedGame,
        };
      },
      version: 2,
    },
  ),
);
