import { getExtrasDisplay } from "../extrasUtils";
import { BallEvent } from "../../state/matchStore";

describe("extrasUtils - get Extras Display", () => {
  // ----------------------------------------------------------------
  // Scenario 1: Non-Extra Deliveries
  // ----------------------------------------------------------------
  describe("Standard deliveries (No extras)", () => {
    it("returns an empty extras array and standard color when isExtra is false", () => {
      const mockBall = {
        isExtra: false,
        runs: 0,
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual([]);
      expect(result.color).toBe("#c471ed");
      expect(result.isExtraOnly).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // Scenario 2: Boundary/Penalty Extras (White Color Shifts)
  // ----------------------------------------------------------------
  describe("Wides and No-Balls (White text color shifts)", () => {
    it("formats a standard wide with no additional runs as extra-only", () => {
      const mockBall = {
        isExtra: true,
        extraType: "wide",
        runs: 0,
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["Wd"]);
      expect(result.color).toBe("#fff");
      expect(result.isExtraOnly).toBe(true);
    });

    it("formats a wide with additional runs and marks isExtraOnly as false", () => {
      const mockBall = {
        isExtra: true,
        extraType: "wide",
        runs: 2, // e.g., Wide that goes for runs or running extras
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["Wd 2"]);
      expect(result.color).toBe("#fff");
      expect(result.isExtraOnly).toBe(false);
    });

    it("formats a no-ball with the correct text prefix", () => {
      const mockBall = {
        isExtra: true,
        extraType: "noBall",
        runs: 1,
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["NB 1"]);
      expect(result.color).toBe("#fff");
      expect(result.isExtraOnly).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // Scenario 3: Fielding/Penalty Extras (Default Color Retention)
  // ----------------------------------------------------------------
  describe("Byes, Leg-Byes, and Penalties", () => {
    it("formats a bye cleanly while retaining the default theme color", () => {
      const mockBall = {
        isExtra: true,
        extraType: "bye",
        runs: 4, // e.g., 4 byes
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["B 4"]);
      expect(result.color).toBe("#c471ed"); // Retains original purple tint
      expect(result.isExtraOnly).toBe(false);
    });

    it("formats a leg-bye string structure accurately", () => {
      const mockBall = {
        isExtra: true,
        extraType: "legBye",
        runs: 0,
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["LB"]);
      expect(result.color).toBe("#c471ed");
      expect(result.isExtraOnly).toBe(true);
    });

    it("formats a penalty run delivery correctly", () => {
      const mockBall = {
        isExtra: true,
        extraType: "penalty",
        runs: 5,
      } as unknown as BallEvent;

      const result = getExtrasDisplay(mockBall);

      expect(result.extras).toEqual(["P 5"]);
      expect(result.isExtraOnly).toBe(false);
    });
  });
});
