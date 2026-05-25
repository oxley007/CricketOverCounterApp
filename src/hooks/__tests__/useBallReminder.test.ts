import { renderHook, act } from "@testing-library/react-native";
import { useBallReminder } from "../useBallReminder";
import { useMatchStore } from "../../state/matchStore";
import { Vibration } from "react-native";

// Mock the React Native module layer natively to isolate Vibration tracking
jest.mock("react-native", () => {
  return {
    Platform: { OS: "ios", select: (objs: any) => objs.ios },
    Vibration: {
      vibrate: jest.fn(),
    },
  };
});

jest.mock("../useIsLiveViewer", () => ({
  useIsLiveViewer: () => false,
}));

jest.mock("../../state/matchStore");

describe("useBallReminder Custom Hook", () => {
  const baseStoreState = {
    events: [],
    proUnlocked: false,
    proUnlockedScorebook: false,
    ballReminderThresholdPercent: 50,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector(baseStoreState),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ----------------------------------------------------------------
  // Scenario 1: Quiet Initialization States
  // ----------------------------------------------------------------
  it("initializes with safe default baselines when no events are logged", () => {
    const { result } = renderHook(() => useBallReminder(true));

    expect(result.current.timeSinceLastBall).toBe(0);
    expect(result.current.formattedTime).toBe("0:00");
    expect(result.current.averageBallTime).toBe(30);
    expect(result.current.paused).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 2: Active Timers and Clock Ticks
  // ----------------------------------------------------------------
  it("increments the elapsed duration tracking when standard play occurs", () => {
    const now = Date.now();
    const stateWithEvent = {
      ...baseStoreState,
      events: [{ type: "ball", countsAsBall: true, timestamp: now }],
    };
    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector(stateWithEvent),
    );

    const { result } = renderHook(() => useBallReminder(true));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeSinceLastBall).toBe(5);
    expect(result.current.formattedTime).toBe("0:05");
    expect(result.current.paused).toBe(false);
  });

  // ----------------------------------------------------------------
  // Scenario 3: Scoreboard Interruptions (Wickets & Over Transitions)
  // ----------------------------------------------------------------
  it("pauses active countdown tracking immediately when a wicket falls", () => {
    const stateWithWicket = {
      ...baseStoreState,
      events: [{ type: "wicket", countsAsBall: true, timestamp: Date.now() }],
    };
    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector(stateWithWicket),
    );

    const { result } = renderHook(() => useBallReminder(true));

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.timeSinceLastBall).toBe(0);
    expect(result.current.paused).toBe(true);
    expect(result.current.pauseReason).toBe("wicket");
  });

  // ----------------------------------------------------------------
  // Scenario 4: Alerts and Hardware Vibrations
  // ----------------------------------------------------------------
  it("triggers physical hardware haptics when timers breach the custom pace threshold", () => {
    const now = Date.now();
    const activePaceState = {
      events: [
        { type: "ball", countsAsBall: true, timestamp: now },
        { type: "ball", countsAsBall: true, timestamp: now + 10000 },
        { type: "ball", countsAsBall: true, timestamp: now + 20000 },
      ],
      proUnlocked: true,
      ballReminderThresholdPercent: 50,
    };

    (useMatchStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector(activePaceState),
    );

    const { result } = renderHook(() => useBallReminder(true));

    act(() => {
      // 1. First jump: Breach the pace line so the flashing interval initializes
      jest.advanceTimersByTime(50000);
    });

    act(() => {
      // 2. Second jump: Progress exactly 500ms further to run the first flash toggle
      jest.advanceTimersByTime(500);
    });

    expect(Vibration.vibrate).toHaveBeenCalled();
    expect(result.current.flashOn).toBe(false); // Captures the inverted state
  });
});
