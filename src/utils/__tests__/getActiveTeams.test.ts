import { getActiveTeams } from "../getActiveTeams";
import { Fixture } from "../../state/fixtureStore";
import { Team } from "../../state/teamStore";

describe("getActiveTeams", () => {
  // Real-world mock IDs from your database payload
  const teamBId = "kguu8isk";
  const teamAId = "pgy67neq";
  const inactiveTeamId = "unplayed_team_id";

  const mockTeams = [
    { id: teamBId, name: "Team B" },
    { id: teamAId, name: "team A" },
    { id: inactiveTeamId, name: "Inactive Club CC" },
  ] as unknown as Team[];

  // ----------------------------------------------------------------
  // Scenario 1: Standard Active Filtering
  // ----------------------------------------------------------------
  it("filters out teams that do not appear in any fixtures", () => {
    // Arrange: Provide a fixture that only features Team B
    const mockFixtures = [
      {
        id: "3u2jcqbj",
        yourTeam: { id: teamBId, name: "Team B" },
      },
    ] as unknown as Fixture[];

    // Act
    const result = getActiveTeams(mockFixtures, mockTeams);

    // Assert: Only Team B should come back out
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(teamBId);
    expect(result[0].name).toBe("Team B");
  });

  // ----------------------------------------------------------------
  // Scenario 2: Handling Duplicates and Guard Rails
  // ----------------------------------------------------------------
  it("returns unique team instances even if they feature in multiple fixtures", () => {
    // Arrange: Team B appears across two separate matches
    const mockFixtures = [
      { id: "match_1", yourTeam: { id: teamBId } },
      { id: "match_2", yourTeam: { id: teamBId } },
    ] as unknown as Fixture[];

    // Act
    const result = getActiveTeams(mockFixtures, mockTeams);

    // Assert: Map should prevent Team B from appearing twice in the array
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(teamBId);
  });

  it("handles corrupt or incomplete fixture objects safely without crashing", () => {
    // Arrange: Fixtures with completely missing yourTeam data blocks
    const mockFixtures = [
      { id: "broken_match_1" },
      { id: "broken_match_2", yourTeam: null },
      { id: "broken_match_3", yourTeam: { id: undefined } },
    ] as unknown as Fixture[];

    // Act
    const result = getActiveTeams(mockFixtures, mockTeams);

    // Assert: Should drop through perfectly and return an empty array
    expect(result).toEqual([]);
  });
});
