import { renderHook, act } from "@testing-library/react-native";
import { useInitialMatchRulesModal } from "../useInitialMatchRulesModal"; // Adjust relative path
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("useInitialMatchRulesModal Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // Scenario 1: First-Time User Flow (Fresh Install)
  // ----------------------------------------------------------------
  it("shows the modal automatically if the user has never seen it before", async () => {
    // Arrange: Simulate AsyncStorage returning null (key doesn't exist yet)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    // Act: Render the hook and resolve the internal async useEffect IIFE
    const { result } = renderHook(() => useInitialMatchRulesModal());

    // We must wait for the microtasks/promises to flush out completely
    await act(async () => {
      await Promise.resolve();
    });

    // Assert: Modal should automatically open
    expect(AsyncStorage.getItem).toHaveBeenCalledWith("hasSeenMatchRules");
    expect(result.current.visible).toBe(true);
  });

  // ----------------------------------------------------------------
  // Scenario 2: Returning User Flow
  // ----------------------------------------------------------------
  it("keeps the modal hidden if the user has already seen it", async () => {
    // Arrange: Simulate AsyncStorage returning "true"
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("true");

    // Act
    const { result } = renderHook(() => useInitialMatchRulesModal());

    await act(async () => {
      await Promise.resolve();
    });

    // Assert: Modal stays closed for returning umpires
    expect(result.current.visible).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 3: Closing the Modal & Saving State
  // ----------------------------------------------------------------
  it("saves the flag to storage and hides the modal when close() is called", async () => {
    // Arrange: Initialize as visible first
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useInitialMatchRulesModal());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.visible).toBe(true);

    // Act: Trigger the close execution path
    await act(async () => {
      await result.current.close();
    });

    // Assert: Check database persistence and state visibility drops
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "hasSeenMatchRules",
      "true",
    );
    expect(result.current.visible).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 4: Manual Override (Open)
  // ----------------------------------------------------------------
  it("allows forcing the modal open manually via the open method", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("true");
    const { result } = renderHook(() => useInitialMatchRulesModal());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.visible).toBe(false);

    // Act: Force manual launch (e.g. user clicked a 'Help' button in the UI)
    act(() => {
      result.current.open();
    });

    // Assert
    expect(result.current.visible).toBe(true);
  });
});
