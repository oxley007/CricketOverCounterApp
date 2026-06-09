import { renderHook } from "@testing-library/react-native";
import { useUndoAction } from "../useUndoAction"; // Adjust relative path if needed
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

describe("useUndoAction Hook", () => {
  // Setup standard spy listeners for state mutations
  const mockUndoLastEvent = jest.fn();
  const mockResetCurrentBowlerAfterUndo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Wire up specific reactive hook selectors
    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        undoLastEvent: mockUndoLastEvent,
        wideIsExtraBall: true,
      }),
    );

    // Wire up global Zustand static getState() targets
    (useMatchStore.getState as jest.Mock).mockReturnValue({
      events: [],
    });

    (useGameStore.getState as jest.Mock).mockReturnValue({
      resetCurrentBowlerAfterUndo: mockResetCurrentBowlerAfterUndo,
    });
  });

  // ----------------------------------------------------------------
  // Scenario 1: Early Exits (Empty Timeline)
  // ----------------------------------------------------------------
  it("does nothing and exits early if there are no events to undo", () => {
    (useMatchStore.getState as jest.Mock).mockReturnValue({ events: [] });

    const { result } = renderHook(() => useUndoAction());
    result.current();

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockUndoLastEvent).not.toHaveBeenCalled();
    expect(mockResetCurrentBowlerAfterUndo).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Scenario 2: Safety Blocks (Wicket Guard)
  // ----------------------------------------------------------------
  it("blocks the undo action and prompts an alert if the last event was a wicket", () => {
    // Arrange: Populate timeline where the final action is a wicket
    const stateWithWicket = {
      events: [
        { type: "ball", countsAsBall: true },
        { type: "wicket" }, // Last event is a wicket
      ],
    };
    (useMatchStore.getState as jest.Mock).mockReturnValue(stateWithWicket);

    const { result } = renderHook(() => useUndoAction());
    result.current();

    // Assert: User is blocked with an explicit native popup message
    expect(Alert.alert).toHaveBeenCalledWith(
      "Undo Not Allowed",
      "You cannot undo after a wicket.",
    );
    expect(mockUndoLastEvent).not.toHaveBeenCalled();
    expect(mockResetCurrentBowlerAfterUndo).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Scenario 3: Clean Execution Flow
  // ----------------------------------------------------------------
  it("calculates the correct balls-this-over offset and adjusts game states", () => {
    // Arrange: Simulate 3 legal deliveries bowled in the active over
    const activeOverState = {
      events: [
        { type: "ball", countsAsBall: true },
        { type: "ball", countsAsBall: true },
        { type: "ball", countsAsBall: true }, // 3 balls total -> index 2
      ],
    };
    (useMatchStore.getState as jest.Mock).mockReturnValue(activeOverState);

    const { result } = renderHook(() => useUndoAction());
    result.current();

    // Assert 1: The over index calculation passes down cleanly (3 balls - 1 offset = index 2)
    expect(mockUndoLastEvent).toHaveBeenCalledWith(2);

    // Assert 2: Bowler records are recalculated after the state rollback completes
    expect(mockResetCurrentBowlerAfterUndo).toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
