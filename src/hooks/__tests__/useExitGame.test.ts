import { renderHook, act } from "@testing-library/react-native";
import { useExitGame } from "../useExitGame"; // Adjust relative path
import { useStartModalStore } from "../../state/startModalStore";
import { useGameStore } from "../../state/gameStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useMatchStore } from "../../state/matchStore";
import { useRouter } from "expo-router";
import { clearLiveEvents } from "../../services/firestoreService";

// ✅ 1. CREATE THE SPY OUTSIDE: Create a single source of truth for the router spy
const mockReplace = jest.fn();

// ✅ 2. BIND THE MOCK: Return the active spy reference directly
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("../../services/firestoreService", () => ({
  clearLiveEvents: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../utils/authHelpers", () => ({
  resetGuestIfNeeded: jest.fn(),
}));

jest.mock("../../state/startModalStore");
jest.mock("../../state/gameStore");
jest.mock("../../state/fixtureStore");
jest.mock("../../state/matchStore");

describe("useExitGame Hook", () => {
  const mockResetGame = jest.fn();
  const mockResetBatters = jest.fn();
  const mockSetSetupComplete = jest.fn();
  const mockTriggerSetup = jest.fn();
  const mockSaveCurrentInnings = jest.fn();
  const mockResetInnings = jest.fn();
  const mockModalReset = jest.fn();
  const mockModalOpen = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // ❌ REMOVED: You can delete the old (useRouter as jest.Mock).mockReturnValue line here

    // Mock Zustand global state handlers
    (useGameStore.getState as jest.Mock).mockReturnValue({
      yourTeam: { id: "kguu8isk" },
      resetGame: mockResetGame,
      resetBatters: mockResetBatters,
      setSetupComplete: mockSetSetupComplete,
      triggerSetup: mockTriggerSetup,
    });

    (useFixtureStore.getState as jest.Mock).mockReturnValue({
      currentFixture: { yourTeam: { id: "kguu8isk" } },
      saveCurrentInnings: mockSaveCurrentInnings,
    });

    (useMatchStore.getState as jest.Mock).mockReturnValue({
      resetInnings: mockResetInnings,
    });

    (useStartModalStore.getState as jest.Mock).mockReturnValue({
      reset: mockModalReset,
      open: mockModalOpen,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ... your 'it' test block scenario remains exactly the same below ...

  // ----------------------------------------------------------------
  // Scenario: Complete State Erasure & Cleanup Pipeline
  // ----------------------------------------------------------------
  it("manages the full exit lifecycle, purges database collections, and routes home", async () => {
    const { result } = renderHook(() => useExitGame());

    // 1. Initial baseline state before exit action executes
    expect(result.current.isExiting).toBe(false);

    // 2. Fire the asynchronous cleanup action function
    await act(async () => {
      await result.current.handleExitNoSave();
    });

    // 3. Assert that the firestore live events table was wiped for the current team
    expect(clearLiveEvents).toHaveBeenCalledWith("kguu8isk");

    // 4. Verify historical match scores were finalized and store schemas reset
    expect(mockSaveCurrentInnings).toHaveBeenCalled();
    expect(useFixtureStore.setState).toHaveBeenCalledWith({
      currentFixture: undefined,
    });
    expect(mockResetInnings).toHaveBeenCalled();
    expect(mockResetGame).toHaveBeenCalled();
    expect(mockSetSetupComplete).toHaveBeenCalledWith(false);

    // 5. Verify the onboarding or startup modal was reset and re-displayed
    expect(mockModalReset).toHaveBeenCalled();
    expect(mockModalOpen).toHaveBeenCalled();

    // 6. Fast-forward the final setTimeout block to kick off the router switch
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // 7. Verify loading spinners drop away and user lands back on home screen
    expect(result.current.isExiting).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
