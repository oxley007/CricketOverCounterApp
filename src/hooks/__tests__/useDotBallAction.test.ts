import { renderHook } from "@testing-library/react-native";
import { useDotBallAction } from "../useDotBallAction"; // Adjust relative path
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { Alert } from "react-native";

jest.mock("react-native", () => {
  return {
    Platform: { OS: "ios", select: (objs: any) => objs.ios },
    Alert: {
      alert: jest.fn(), // Graft a direct spy tracking function right here
    },
  };
});

// Mock your external hooks and stores
jest.mock("../useFeedback", () => ({
  useFeedback: () => ({ triggerTap: jest.fn() }),
}));

jest.mock("../../state/gameStore");
jest.mock("../../state/matchStore");

describe("useDotBallAction Hook", () => {
  // Define clean baseline mocks for our store functions
  const mockAddEvent = jest.fn();
  const mockUpdateBatterStats = jest.fn();
  const mockUpdateBowlerStats = jest.fn();
  const mockApplyStrikeChange = jest.fn();

  // Baseline data shapes matching your database format
  const baseGameState = {
    currentGame: {
      currentStrikeId: "player_striker",
      currentBowlerId: "player_bowler",
      lastBowlerId: "player_old_bowler",
      activeBatters: [
        { playerId: "player_striker", batterInningId: "inning_123" },
      ],
    },
    updateBatterStats: mockUpdateBatterStats,
    updateBowlerStats: mockUpdateBowlerStats,
    applyStrikeChange: mockApplyStrikeChange,
  };

  const baseMatchState = {
    events: [],
    wideIsExtraBall: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Wire up the Zustand global getState() catch overrides
    (useGameStore.getState as jest.Mock).mockReturnValue(baseGameState);
    (useMatchStore.getState as jest.Mock).mockReturnValue(baseMatchState);

    // Wire up specific reactive hooks
    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ addEvent: mockAddEvent }),
    );
  });

  // ----------------------------------------------------------------
  // Scenario 1: Scorebook Validation Guards
  // ----------------------------------------------------------------
  describe("Scorebook Validation Guards (isScorebook = true)", () => {
    it("intercepts execution and triggers an Alert if no bowler is selected", () => {
      // Arrange: Set bowler to missing/falsy
      const brokenGameState = {
        ...baseGameState,
        currentGame: {
          ...baseGameState.currentGame,
          currentBowlerId: undefined,
        },
      };
      (useGameStore.getState as jest.Mock).mockReturnValue(brokenGameState);

      // Act
      const { result } = renderHook(() => useDotBallAction(true));
      result.current(); // Execute the returned function

      // Assert
      expect(Alert.alert).toHaveBeenCalledWith(
        "Please select a bowler to continue",
      );
      expect(mockAddEvent).not.toHaveBeenCalled(); // Ensure execution halted
    });

    it("intercepts execution and alerts if the over limit is hit with the same bowler", () => {
      // Arrange: Fill match events up to 6 balls this over
      const fullOverMatchState = {
        events: Array(6).fill({ type: "ball", countsAsBall: true }),
        wideIsExtraBall: true,
      };
      const badBowlerGameState = {
        ...baseGameState,
        currentGame: {
          ...baseGameState.currentGame,
          currentBowlerId: "player_bowler",
          lastBowlerId: "player_bowler", // Same bowler exception guard line triggered
        },
      };
      (useMatchStore.getState as jest.Mock).mockReturnValue(fullOverMatchState);
      (useGameStore.getState as jest.Mock).mockReturnValue(badBowlerGameState);

      // Act
      const { result } = renderHook(() => useDotBallAction(true));
      result.current();

      // Assert
      expect(Alert.alert).toHaveBeenCalledWith(
        "Please add the next bowler to continue",
      );
      expect(mockAddEvent).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Scenario 2: Successful Execution Pipeline
  // ----------------------------------------------------------------
  describe("Successful Dot Ball Action execution", () => {
    it("dispatches events and updates match/player states flawlessly", () => {
      // Act
      const { result } = renderHook(() => useDotBallAction(true));
      result.current();

      // Assert 1: Event Log Verification
      expect(mockAddEvent).toHaveBeenCalledWith({
        type: "ball",
        batterId: "player_striker",
        batterInningId: "inning_123",
        bowlerId: "player_bowler",
        runs: 0,
        isExtra: false,
        countsAsBall: true,
        runBreakdown: { bat: 0, extras: 0 },
        prevBatterId: "player_striker",
      });

      // Assert 2: Player Cumulative Progressions
      expect(mockUpdateBatterStats).toHaveBeenCalledWith(
        "player_striker",
        0,
        1,
      );
      expect(mockUpdateBowlerStats).toHaveBeenCalledWith(
        "player_bowler",
        0,
        1,
        0,
        undefined,
      );

      // Assert 3: Strategic Game Transitions
      expect(mockApplyStrikeChange).toHaveBeenCalledWith({
        bat: 0,
        extras: 0,
        countsAsBall: true,
        runs: 0,
      });
    });

    it("bypasses player validation cleanly if isScorebook is false (Simple Counter mode)", () => {
      // Arrange: Strip player ids out entirely (representing generic counter taps)
      const simplifiedGameState = {
        ...baseGameState,
        currentGame: {
          currentStrikeId: undefined,
          currentBowlerId: undefined,
          activeBatters: [],
        },
      };
      (useGameStore.getState as jest.Mock).mockReturnValue(simplifiedGameState);

      // Act: Pass false to target generic umpire tap tracking
      const { result } = renderHook(() => useDotBallAction(false));
      result.current();

      // Assert: Simple counter should create generic ball log without triggers or alerts
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ball",
          runs: 0,
          countsAsBall: true,
        }),
      );
    });
  });
});
