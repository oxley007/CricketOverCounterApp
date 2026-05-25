import { renderHook } from "@testing-library/react-native";
import { useFeedback } from "../useFeedback"; // Adjust relative path
import * as Haptics from "expo-haptics";

// ✅ Mock the entire expo-haptics package cleanly
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: "success_feedback_type_placeholder",
  },
}));

describe("useFeedback Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // Scenario 1: Standard Tap Haptics
  // ----------------------------------------------------------------
  it("triggers a subtle selection haptic tap when triggerTap is executed", () => {
    const { result } = renderHook(() => useFeedback());

    // Execute the tap function
    result.current.triggerTap();

    // Verify the Expo engine received the hardware call
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // Scenario 2: Match Success/Wicket Alerts
  // ----------------------------------------------------------------
  it("triggers a success notification haptic alert pattern when triggerSuccess executes", () => {
    const { result } = renderHook(() => useFeedback());

    // Execute the success function
    result.current.triggerSuccess();

    // Verify it passed the custom Success enum value down to the hardware handler
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
