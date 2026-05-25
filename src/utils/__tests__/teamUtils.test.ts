import { getInningsTeamNames } from "../teamUtils";
import { Fixture } from "../../state/fixtureStore";

describe("getInningsTeamNames", () => {
  // Real-world identifiers pulled from your database snapshot structure
  const realFixtureMock = {
    id: "3u2jcqbj",
    yourTeam: {
      id: "kguu8isk",
      name: "Team B",
    },
    oppositionTeam: {
      id: "pgy67neq",
      name: "team A",
    },
  } as unknown as Fixture;

  // ----------------------------------------------------------------
  // Scenario 1: Fallbacks and Guard Rails
  // ----------------------------------------------------------------
  describe("Safety Fallbacks", () => {
    it("returns Unknown defaults if the fixture is missing or undefined", () => {
      const result = getInningsTeamNames(undefined, "kguu8isk");

      expect(result.battingTeamName).toBe("Unknown");
      expect(result.bowlingTeamName).toBe("Unknown");
    });

    it("returns Unknown defaults if the active batting ID is missing or undefined", () => {
      const result = getInningsTeamNames(realFixtureMock, undefined);

      expect(result.battingTeamName).toBe("Unknown");
      expect(result.bowlingTeamName).toBe("Unknown");
    });
  });

  // ----------------------------------------------------------------
  // Scenario 2: Main Scoreboard Direction Flips
  // ----------------------------------------------------------------
  describe("Scoreboard Role Alignments", () => {
    it("assigns roles correctly when Your Team (Team B) is actively batting", () => {
      // Act: Pass Team B's ID as the current batting ID
      const result = getInningsTeamNames(realFixtureMock, "kguu8isk");

      // Assert
      expect(result.battingTeamName).toBe("Team B");
      expect(result.bowlingTeamName).toBe("team A");
    });

    it("flips the roles correctly when the Opposition Team (team A) is actively batting", () => {
      // Act: Pass Team A's ID as the current batting ID
      const result = getInningsTeamNames(realFixtureMock, "pgy67neq");

      // Assert
      expect(result.battingTeamName).toBe("team A");
      expect(result.bowlingTeamName).toBe("Team B");
    });
  });
});
