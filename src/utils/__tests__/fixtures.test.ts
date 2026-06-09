import { normalizeFixture, Fixture } from "../fixtures";

describe("normalizeFixture", () => {
  // ----------------------------------------------------------------
  // Scenario 1: Filtering Out Placeholders
  // ----------------------------------------------------------------
  it("filters out placeholder innings completely from the array", () => {
    // Arrange: Mock fixture mirroring your structural shape
    const mockFixture = {
      id: "3u2jcqbj",
      completed: true,
      innings: [
        {
          inningsNumber: 1,
          isPlaceholder: false,
          matchEvents: [],
          battingEntries: [],
        },
        {
          inningsNumber: 2,
          isPlaceholder: true, // ⚠️ Should be deleted by normalizer
          matchEvents: [],
          battingEntries: [],
        },
      ],
    } as unknown as Fixture;

    // Act
    const result = normalizeFixture(mockFixture);

    // Assert
    expect(result.innings.length).toBe(1);
    expect(result.innings[0].inningsNumber).toBe(1);
  });

  // ----------------------------------------------------------------
  // Scenario 2: Handling Object-Based Innings Formats
  // ----------------------------------------------------------------
  it("successfully normalizes fixtures where innings are stored as an Object/Record", () => {
    // Arrange: Sometimes Firestore or states save objects instead of arrays
    const mockFixture = {
      id: "3u2jcqbj",
      completed: true,
      innings: {
        inn_1: { inningsNumber: 1, matchEvents: [], battingEntries: [] },
        inn_2: { inningsNumber: 2, matchEvents: [], battingEntries: [] },
      },
    } as unknown as Fixture;

    // Act
    const result = normalizeFixture(mockFixture);

    // Assert
    expect(Array.isArray(result.innings)).toBe(true);
    expect(result.innings.length).toBe(2);
  });

  // ----------------------------------------------------------------
  // Scenario 3: Math Accumulations and Player Aggregations
  // ----------------------------------------------------------------
  it("accurately calculates innings totals and aggregates player runs/balls across multiple innings", () => {
    // Arrange: Raw dataset reflecting real multi-innings scoring bursts
    const mockFixture = {
      id: "3u2jcqbj",
      completed: true,
      innings: [
        {
          inningsNumber: 1,
          matchEvents: [
            { countsAsBall: true, runs: 4, batterId: "player_A" },
            { countsAsBall: false, runs: 1, batterId: "player_A" }, // Wide/NoBall extra
            { countsAsBall: true, runs: 0, batterId: "player_B" },
          ],
          battingEntries: [
            { playerId: "player_A", runs: 5, balls: 2 },
            { playerId: "player_B", runs: 0, balls: 1 },
          ],
        },
        {
          inningsNumber: 3, // Multi-innings jump
          matchEvents: [{ countsAsBall: true, runs: 6, batterId: "player_A" }],
          battingEntries: [{ playerId: "player_A", runs: 6, balls: 1 }],
        },
      ],
    } as unknown as Fixture;

    // Act
    const result = normalizeFixture(mockFixture);

    // Assert 1: Verify direct mutations on the Innings sub-objects
    const firstInnings = result.innings[0] as any;
    expect(firstInnings.totalBalls).toBe(2); // Only countsAsBall true
    expect(firstInnings.totalRuns).toBe(5); // 4 + 1

    // Assert 2: Verify cumulative player analytics dictionary
    // Player A: 5 runs (Inn 1) + 6 runs (Inn 3) = 11 runs. 2 balls + 1 ball = 3 balls.
    expect(result.totalsPerPlayer["player_A"]).toEqual({
      runs: 11,
      balls: 3,
    });

    // Player B: Retains their specific baseline totals
    expect(result.totalsPerPlayer["player_B"]).toEqual({
      runs: 0,
      balls: 1,
    });
  });
});
