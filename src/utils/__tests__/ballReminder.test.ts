import { getAverageSecondsPerBall, getReminderDelayMs } from "../ballReminder";
import { MatchEvent } from "../../state/matchStore";

describe("ballReminder Utils", () => {
  // ----------------------------------------------------------------
  // Test Set 1: getAverageSecondsPerBall
  // ----------------------------------------------------------------
  describe("getAverageSecondsPerBall", () => {
    // ✅ Update 1: Change the description and assert on 2 balls returning null
    it("returns null if there are fewer than 3 legal balls", () => {
      const events: Partial<MatchEvent>[] = [
        { countsAsBall: true, timestamp: 1000 },
        { countsAsBall: true, timestamp: 5000 }, // Only 2 balls total
      ];

      const result = getAverageSecondsPerBall(events as MatchEvent[]);
      expect(result).toBeNull();
    });

    it("ignores illegal balls when calculating the average", () => {
      const now = Date.now();

      // ✅ Changed the typecast to 'as unknown as MatchEvent[]'
      const events = [
        { countsAsBall: true, timestamp: now }, // Ball 1
        { countsAsBall: false, timestamp: now + 5000 }, // Ignored extra
        { countsAsBall: true, timestamp: now + 10000 }, // Ball 2 (+10s)
        { countsAsBall: true, timestamp: now + 20000 }, // Ball 3 (+10s)
        { countsAsBall: true, timestamp: now + 35000 }, // Ball 4 (+7.4s)
      ] as unknown as MatchEvent[]; // Force TypeScript to accept this structure

      const result = getAverageSecondsPerBall(events);

      // 35 seconds total / 3 intervals = 11.666...
      // We check that the result is accurate to 2 decimal places (11.67)
      expect(result).toBeCloseTo(11.67, 2);
    });

    it("calculates the correct average over multiple legal balls", () => {
      // Arrange
      const now = Date.now();
      const events: Partial<MatchEvent>[] = [
        { countsAsBall: true, timestamp: now }, // Ball 1
        { countsAsBall: true, timestamp: now + 20000 }, // Ball 2 (+20s)
        { countsAsBall: true, timestamp: now + 50000 }, // Ball 3 (+30s)
      ];

      // Act
      const result = getAverageSecondsPerBall(events as MatchEvent[]);

      // Assert (Total diff = 50s. Total intervals = 2. Average = 25s)
      expect(result).toBe(25);
    });
  });

  // ----------------------------------------------------------------
  // Test Set 2: getReminderDelayMs
  // ----------------------------------------------------------------
  describe("getReminderDelayMs", () => {
    it("calculates delay with a percentage threshold correctly", () => {
      // Arrange
      const avgSeconds = 30;
      const thresholdPercent = 20; // 20% extra time

      // Act
      const result = getReminderDelayMs(avgSeconds, thresholdPercent);

      // Assert (30s * 1.20 = 36s = 36000ms)
      expect(result).toBe(36000);
    });
  });
});
