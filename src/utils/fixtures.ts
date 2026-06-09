// src/utils/fixtures.ts

export type MatchEvent = {
  countsAsBall: boolean;
  runs: number;
  batterId: string;
};

export type BattingEntry = {
  playerId: string;
  balls: number;
  runs: number;
};

export type Innings = {
  inningsNumber: number;
  isPlaceholder?: boolean;
  matchEvents: MatchEvent[];
  battingEntries: BattingEntry[];
};

export type Fixture = {
  id: string;
  innings: Innings[] | Record<string, Innings>;
  completed: boolean;
};

export type NormalizedFixture = Fixture & {
  innings: Innings[];
  totalsPerPlayer: Record<string, { runs: number; balls: number }>;
};

export function normalizeFixture(fixture: Fixture): NormalizedFixture {
  const inningsArray: Innings[] = Array.isArray(fixture.innings)
    ? fixture.innings
    : Object.values(fixture.innings);

  const validInnings = inningsArray.filter((inn) => !inn.isPlaceholder);

  const totalsPerPlayer: Record<string, { runs: number; balls: number }> = {};

  validInnings.forEach((inn) => {
    const totalBalls = inn.matchEvents.reduce(
      (sum, e) => sum + (e.countsAsBall ? 1 : 0),
      0,
    );
    const totalRuns = inn.matchEvents.reduce((sum, e) => sum + e.runs, 0);

    (inn as any).totalBalls = totalBalls;
    (inn as any).totalRuns = totalRuns;

    inn.battingEntries.forEach((entry) => {
      if (!totalsPerPlayer[entry.playerId]) {
        totalsPerPlayer[entry.playerId] = { runs: 0, balls: 0 };
      }
      totalsPerPlayer[entry.playerId].runs += entry.runs;
      totalsPerPlayer[entry.playerId].balls += entry.balls;
    });
  });

  return {
    ...fixture,
    innings: validInnings,
    totalsPerPlayer,
  };
}
