import { calculateFixtureResult } from "../calculateFixtureResult";
import { Fixture } from "../../state/fixtureStore";

describe("calculateFixtureResult – Realistic Data Testing", () => {
  // ----------------------------------------------------------------
  // Scenario 1: Match Abandoned or Incomplete
  // ----------------------------------------------------------------
  describe("Abandoned and incomplete match states", () => {
    it("returns abandoned status when the fixture flag is explicitly true", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: true,
        completed: false,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq", // Team A
            bowlingTeamId: "kguu8isk", // Team B
            totalRuns: 17,
            totalWickets: 1,
            totalBalls: 17,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      expect(result.type).toBe("abandoned");
      expect(result.margin).toBe("Match abandoned");
      expect(result.teamTotals["pgy67neq"]).toBe(17);
    });

    it("returns a draw type if fewer than two teams have batted", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: false,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq",
            bowlingTeamId: "kguu8isk",
            totalRuns: 40,
            totalWickets: 10,
            totalBalls: 36,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      expect(result.type).toBe("draw");
      expect(result.isDraw).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // Scenario 2: Drawn and Run-margin outcomes
  // ----------------------------------------------------------------
  describe("Drawn and Run-margin outcomes", () => {
    it("returns a drawn match state if total aggregate runs match exactly", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: true,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq", // Team A scores 17
            bowlingTeamId: "kguu8isk",
            totalRuns: 17,
            totalWickets: 1,
            totalBalls: 17,
          },
          {
            inningsNumber: 2,
            battingTeamId: "kguu8isk", // Team B scores 17
            bowlingTeamId: "pgy67neq",
            totalRuns: 17,
            totalWickets: 1,
            totalBalls: 17,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      expect(result.type).toBe("draw");
      expect(result.isDraw).toBe(true);
      expect(result.margin).toBe("Match drawn");
    });

    it("defaults to a victory by runs if the first batting team scores more", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: true,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq", // Team A sets a big target
            bowlingTeamId: "kguu8isk",
            totalRuns: 45,
            totalWickets: 5,
            totalBalls: 36,
          },
          {
            inningsNumber: 2,
            battingTeamId: "kguu8isk", // Team B falls short
            bowlingTeamId: "pgy67neq",
            totalRuns: 30,
            totalWickets: 10,
            totalBalls: 32,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      expect(result.type).toBe("runs");
      expect(result.winnerTeamId).toBe("pgy67neq"); // Team A wins
      expect(result.margin).toBe("Won by 15 runs");
    });
  });

  // ----------------------------------------------------------------
  // Scenario 3: Complex Outcomes (Wickets and Innings Victories)
  // ----------------------------------------------------------------
  describe("Wickets and Innings calculations", () => {
    it("detects a successful run chase victory by wickets", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: true,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq", // Team A sets target of 17
            bowlingTeamId: "kguu8isk",
            totalRuns: 17,
            totalWickets: 10,
            totalBalls: 17,
          },
          {
            inningsNumber: 2,
            battingTeamId: "kguu8isk", // Team B hits 18 to win the chase
            bowlingTeamId: "pgy67neq",
            totalRuns: 18,
            totalWickets: 4, // 10 - 4 = 6 wickets remaining
            totalBalls: 15,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      expect(result.type).toBe("wickets");
      expect(result.winnerTeamId).toBe("kguu8isk"); // Chasing team B wins
      expect(result.margin).toBe("Won by 6 wickets");
    });

    it("calculates an extreme multi-innings victory margin", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: true,
        innings: [
          {
            inningsNumber: 1,
            battingTeamId: "pgy67neq", // Team A Innings 1
            bowlingTeamId: "kguu8isk",
            totalRuns: 100,
            totalWickets: 10,
          },
          {
            inningsNumber: 2,
            battingTeamId: "kguu8isk", // Team B Innings 1 (Enormous score)
            bowlingTeamId: "pgy67neq",
            totalRuns: 450,
            totalWickets: 5,
          },
          {
            inningsNumber: 3,
            battingTeamId: "pgy67neq", // Team A Innings 2 (Forced to follow on)
            bowlingTeamId: "kguu8isk",
            totalRuns: 120,
            totalWickets: 10,
          },
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      // Team B = 450 runs (1 innings)
      // Team A = 100 + 120 = 220 runs (2 innings)
      // Margin = 450 - 220 = 230 runs
      expect(result.type).toBe("innings");
      expect(result.winnerTeamId).toBe("kguu8isk");
      expect(result.margin).toBe("Won by an innings and 230 runs");
    });
  });

  // ----------------------------------------------------------------
  // Scenario 4: Full Multi-Innings Short Match (Bonus Real-Data Match Scenario)
  // ----------------------------------------------------------------
  describe("Multi-Innings Cumulative Results (Full Match Profile)", () => {
    it("aggregates scores properly across a complex 8-innings match structure", () => {
      const mockFixture = {
        id: "3u2jcqbj",
        abandoned: false,
        completed: true,
        innings: [
          { inningsNumber: 1, battingTeamId: "pgy67neq", totalRuns: 17 }, // Team A
          { inningsNumber: 2, battingTeamId: "kguu8isk", totalRuns: 17 }, // Team B
          { inningsNumber: 3, battingTeamId: "kguu8isk", totalRuns: 8 }, // Team B
          { inningsNumber: 4, battingTeamId: "pgy67neq", totalRuns: 8 }, // Team A
          { inningsNumber: 5, battingTeamId: "kguu8isk", totalRuns: 9 }, // Team B
          { inningsNumber: 6, battingTeamId: "pgy67neq", totalRuns: 9 }, // Team A
          { inningsNumber: 7, battingTeamId: "kguu8isk", totalRuns: 12 }, // Team B
          { inningsNumber: 8, battingTeamId: "pgy67neq", totalRuns: 6 }, // Team A (Final Chasing Innings)
        ],
      } as unknown as Fixture;

      const result = calculateFixtureResult(mockFixture);

      // Team B (kguu8isk) aggregate: 17 + 8 + 9 + 12 = 46 runs
      // Team A (pgy67neq) aggregate: 17 + 8 + 9 + 6 = 40 runs
      // Margin = 46 - 40 = 6 runs
      expect(result.type).toBe("runs");
      expect(result.winnerTeamId).toBe("kguu8isk");
      expect(result.margin).toBe("Won by 6 runs");
      expect(result.teamTotals["kguu8isk"]).toBe(46);
      expect(result.teamTotals["pgy67neq"]).toBe(40);
    });
  });
});
