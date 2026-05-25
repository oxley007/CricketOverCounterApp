import { renderHook } from "@testing-library/react-native";
import { usePlusAction } from "../usePlusAction"; // Adjust relative path if needed
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { Alert } from "react-native";

// Mock the React Native module layer natively to isolate Alert tracking
jest.mock("react-native", () => {
  return {
    Platform: { OS: "ios", select: (objs: any) => objs.ios },
    Alert: {
      alert: jest.fn(),
    },
  };
});

jest.mock("../useFeedback", () => ({
  useFeedback: () => ({ triggerTap: jest.fn() }),
}));

jest.mock("../../state/gameStore");
jest.mock("../../state/matchStore");

describe("usePlusAction Hook", () => {
  // Setup standard spy function listeners
  const mockSetModalVisible = jest.fn();
  const mockSetRetireOnlyMode = jest.fn();

  // Baseline mock store configurations
  const baseGameState = {
    currentGame: {
      battingTeamId: "team_a_id",
      currentStrikeId: "player_striker",
      currentBowlerId: "player_bowler",
      lastBowlerId: "player_old_bowler",
      activeBatters: [
        { playerId: "player_striker", batterInningId: "inning_123" },
      ],
      ballsThisOver: 0,
    },
  };

  const baseMatchState = {
    events: [],
    wideIsExtraBall: true,
    wicketsAsNegativeRuns: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Wire up global Zustand triggers
    (useGameStore.getState as jest.Mock).mockReturnValue(baseGameState);
    (useMatchStore.getState as jest.Mock).mockReturnValue(baseMatchState);
  });

  // ----------------------------------------------------------------
  // Scenario 1: Simple Counter Mode Validation Guards
  // ----------------------------------------------------------------
  describe("Simple Counter Mode Validation Guards (isScorebook = false)", () => {
    it("alerts and blocks action if no batting team has been selected", () => {
      const brokenGameState = {
        currentGame: {
          ...baseGameState.currentGame,
          battingTeamId: undefined, // Stripped for validation failure trigger
        },
      };
      (useGameStore.getState as jest.Mock).mockReturnValue(brokenGameState);

      const { result } = renderHook(() =>
        usePlusAction({
          isScorebook: false,
          setModalVisible: mockSetModalVisible,
          setRetireOnlyMode: mockSetRetireOnlyMode,
        }),
      );

      result.current();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Teams Required",
        "Please select the batting team before you start scoring.",
      );
      expect(mockSetModalVisible).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Scenario 2: Deep Scorebook Mode Validation Guards
  // ----------------------------------------------------------------
  describe("Scorebook Mode Validation Guards (isScorebook = true)", () => {
    it("alerts and blocks action if no bowler has been selected", () => {
      const brokenGameState = {
        currentGame: {
          ...baseGameState.currentGame,
          currentBowlerId: undefined,
        },
      };
      (useGameStore.getState as jest.Mock).mockReturnValue(brokenGameState);

      const { result } = renderHook(() =>
        usePlusAction({
          isScorebook: true,
          setModalVisible: mockSetModalVisible,
          setRetireOnlyMode: mockSetRetireOnlyMode,
        }),
      );

      result.current();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Please add a bowler to continue",
      );
      expect(mockSetModalVisible).not.toHaveBeenCalled();
    });

    it("alerts and blocks action if the facing striker is missing", () => {
      const brokenGameState = {
        currentGame: {
          ...baseGameState.currentGame,
          currentStrikeId: "unknown_player_id", // Won't match activeBatters array find lookup
        },
      };
      (useGameStore.getState as jest.Mock).mockReturnValue(brokenGameState);

      const { result } = renderHook(() =>
        usePlusAction({
          isScorebook: true,
          setModalVisible: mockSetModalVisible,
          setRetireOnlyMode: mockSetRetireOnlyMode,
        }),
      );

      result.current();

      expect(Alert.alert).toHaveBeenCalledWith(
        "Please select the facing batter to continue",
      );
      expect(mockSetModalVisible).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // Scenario 3: Complex Interactive Over Guards
  // ----------------------------------------------------------------
  describe("Over Limit Transitions and Button Actions", () => {
    it("triggers over boundary warnings and intercepts custom button tap configurations", () => {
      // Setup a full over state matching parameters
      const completeOverMatchState = {
        events: Array(6).fill({ type: "ball", countsAsBall: true }), // Causes actualBallsThisOver = 6
        wideIsExtraBall: true,
        wicketsAsNegativeRuns: false, // Triggers specific text branch choice
      };
      const lockedBowlerGameState = {
        currentGame: {
          ...baseGameState.currentGame,
          currentBowlerId: "player_bowler",
          lastBowlerId: "player_bowler", // Locks bowler to trigger limit block
        },
      };

      (useMatchStore.getState as jest.Mock).mockReturnValue(
        completeOverMatchState,
      );
      (useGameStore.getState as jest.Mock).mockReturnValue(
        lockedBowlerGameState,
      );

      const { result } = renderHook(() =>
        usePlusAction({
          isScorebook: true,
          setModalVisible: mockSetModalVisible,
          setRetireOnlyMode: mockSetRetireOnlyMode,
        }),
      );

      result.current();

      // Assert that alert intercepts execution paths cleanly
      expect(Alert.alert).toHaveBeenCalledWith(
        "Over Complete",
        "This over is complete.\n\nAdd the next bowler to continue scoring.\nIf you need to retire a batter, you can continue.",
        expect.any(Array), // Asserts that button control parameters array exists
      );

      // Extract the buttons configuration array passed directly to the alert module
      const alertButtonsCall = (Alert.alert as jest.Mock).mock.calls[0][2];

      // Select the 'Continue to Retire Batter' button object (index 1) and fire its onPress execution
      const actionButton = alertButtonsCall[1];
      actionButton.onPress();

      // Verify that intercept state targets are updated
      expect(mockSetRetireOnlyMode).toHaveBeenCalledWith(true);
      expect(mockSetModalVisible).toHaveBeenCalledWith(true);
    });
  });

  // ----------------------------------------------------------------
  // Scenario 4: Clean Normal Execution Flow
  // ----------------------------------------------------------------
  describe("Successful Execution Pipeline", () => {
    it("opens the modal action tray immediately if all match validation parameters clear", () => {
      const { result } = renderHook(() =>
        usePlusAction({
          isScorebook: true,
          setModalVisible: mockSetModalVisible,
          setRetireOnlyMode: mockSetRetireOnlyMode,
        }),
      );

      result.current();

      // Ensure it slips straight down past the validation blocks to open the dashboard tray
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockSetModalVisible).toHaveBeenCalledWith(true);
    });
  });
});
