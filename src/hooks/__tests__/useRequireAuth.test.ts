import { renderHook, act } from "@testing-library/react-native";
import { useRequireAuth } from "../useRequireAuth"; // Adjust relative path if needed
import { useAuthStore } from "../../state/authStore";
import { auth } from "../../services/firebaseConfig";

jest.mock("../../state/authStore");

describe("useRequireAuth Hook", () => {
  const mockAction = jest.fn(() => Promise.resolve());

  let currentStoreState = {
    isGuest: false,
    guestMatchesPlayed: 0,
  };

  let activeSubscribeCallback: (state: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    currentStoreState = { isGuest: false, guestMatchesPlayed: 0 };
    (auth as any).currentUser = null;

    (useAuthStore.getState as jest.Mock).mockImplementation(
      () => currentStoreState,
    );

    (useAuthStore.subscribe as jest.Mock).mockImplementation((callback) => {
      activeSubscribeCallback = callback;
      return jest.fn(); // Unsubscribe teardown mock
    });
  });

  // ----------------------------------------------------------------
  // Scenario 1: Standard Authenticated User (Express Lane)
  // ----------------------------------------------------------------
  it("fires the action immediately if a fully logged-in account exists", async () => {
    (auth as any).currentUser = { uid: "user_123" };

    const { result } = renderHook(() => useRequireAuth());

    let executed = false;
    await act(async () => {
      executed = await result.current.requireAuth(mockAction);
    });

    expect(executed).toBe(true);
    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(result.current.authVisible).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 2: Asynchronous Authentication Stalling Gating
  // ----------------------------------------------------------------
  it("stalls execution, prompts the modal, and resumes action upon successful login", async () => {
    (auth as any).currentUser = null;

    const { result } = renderHook(() => useRequireAuth({ allowGuest: false }));

    // Act: Attempt to run the action
    let executed = true;
    await act(async () => {
      executed = await result.current.requireAuth(mockAction);
    });

    // Assert: Action is queued up silently, and modal is visible
    expect(executed).toBe(false);
    expect(mockAction).not.toHaveBeenCalled();
    expect(result.current.authVisible).toBe(true);

    // Act: Simulate successful login by modifying state and firing the subscription callback
    await act(async () => {
      (auth as any).currentUser = { uid: "new_user_456" };
      currentStoreState.isGuest = false;

      // This alerts the hook's useEffect to process the pending action
      activeSubscribeCallback(currentStoreState);
    });

    // Assert: The action is now successfully flushed and executed!
    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(result.current.authVisible).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 3: Guest Usage Caps
  // ----------------------------------------------------------------
  it("blocks guest execution and prompts registration if the usage cap limit is breached", async () => {
    (auth as any).currentUser = null;
    currentStoreState = {
      isGuest: true,
      guestMatchesPlayed: 1,
    };

    const { result } = renderHook(() =>
      useRequireAuth({ enforceGuestLimit: true }),
    );

    let executed = true;
    await act(async () => {
      executed = await result.current.requireAuth(mockAction);
    });

    expect(executed).toBe(false);
    expect(mockAction).not.toHaveBeenCalled();
    expect(result.current.authVisible).toBe(true);
  });
});
