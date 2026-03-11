// src/state/seasonStatsHelpers.ts

import type { Fixture } from "./fixtureStore";
import { calculateBowlerStats } from "./gameHelpers";
import type { Team } from "./teamStore";

/* =========================
   TYPES
========================= */
interface SeasonPlayerStatsParams {
  fixtures: Fixture[];
  teamId: string;
  season: string;
  playerId: string;
}

export interface SeasonPlayerStats {
  batting: {
    matches: number;
    innings: number;
    runs: number;
    balls: number;
    dismissals: number;
    average: string;
    strikeRate: string;
    highestScore: number;

    dotBalls: number;
    dotBallPct: string;
    fours: number;
    sixes: number;
    foursPct: string;
    sixesPct: string;
    boundaryRunsPct: string;
    ballsPerBoundary: string;
    notOuts: number;
    fifties: number;
    hundreds: number;
  };
  bowling: {
    matches: number;
    overs: string;
    balls: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: string;
    wides: number;
    noBalls: number;

    average: string;
    strikeRate: string;
    dotBalls: number;
    dotBallPct: string;
    foursConceded: number;
    sixesConceded: number;
    boundaryBallsPct: string;
  };
}

/* =========================
   SEASON PLAYER STATS
========================= */
export function getSeasonPlayerStats({
  fixtures,
  teamId,
  season,
  playerId,
}: SeasonPlayerStatsParams): SeasonPlayerStats {
  const seasonFixtures = fixtures.filter(
    (f) => f.season === season && f.yourTeam.id === teamId,
  );

  // -----------------
  // MATCH COUNT
  // -----------------
  const matchesPlayed = seasonFixtures.filter((f) => {
    if (!f.innings) return false;
    const inningsArray = Array.isArray(f.innings)
      ? f.innings
      : Object.values(f.innings);
    return inningsArray.some(
      (inn) =>
        inn.battingEntries.some((e) => e.playerId === playerId) ||
        inn.matchEvents.some((e) => e.bowlerId === playerId),
    );
  }).length;

  // -----------------
  // BATTING / BOWLING
  // -----------------
  let inningsCount = 0;
  let totalRuns = 0;
  let totalBalls = 0;
  let dismissals = 0;
  let highestScore = 0;
  let totalDotBalls = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let notOuts = 0;
  let fifties = 0;
  let hundreds = 0;

  let totalBallsBowled = 0;
  let totalRunsConceded = 0;
  let totalWickets = 0;
  let totalMaidens = 0;
  let totalWides = 0;
  let totalNoBalls = 0;
  let totalDotBallsBowled = 0;
  let totalFoursConceded = 0;
  let totalSixesConceded = 0;

  seasonFixtures.forEach((fixture) => {
    if (!fixture.innings) return;
    const inningsArray = Array.isArray(fixture.innings)
      ? fixture.innings
      : Object.values(fixture.innings);

    inningsArray.forEach((inn) => {
      // ===== BATTING =====
      if (inn.battingTeamId === teamId) {
        const playerEntries = inn.battingEntries.filter(
          (e) => e.playerId === playerId,
        );

        playerEntries.forEach((entry) => {
          inningsCount++;

          const playerEvents = inn.matchEvents.filter(
            (e) => e.batterInningId === entry.entryId,
          );

          // Runs scored and balls faced
          const runsScored = playerEvents.reduce(
            (sum, e) => sum + e.runBreakdown.bat,
            0,
          );
          totalRuns += runsScored;

          const ballsFaced = playerEvents.filter((e) => e.countsAsBall).length;
          totalBalls += ballsFaced;

          // Dot balls, fours, sixes
          totalDotBalls += playerEvents.filter(
            (e) => e.countsAsBall && e.runBreakdown.bat === 0,
          ).length;
          totalFours += playerEvents.filter(
            (e) => e.runBreakdown.bat === 4,
          ).length;
          totalSixes += playerEvents.filter(
            (e) => e.runBreakdown.bat === 6,
          ).length;

          // Dismissals / Not outs
          if (entry.dismissal) dismissals++;
          else notOuts++;

          // Highest score, fifties, hundreds
          if (runsScored > highestScore) highestScore = runsScored;
          if (runsScored >= 50 && runsScored < 100) fifties++;
          if (runsScored >= 100) hundreds++;
        });
      }

      // ===== BOWLING =====
      if (inn.bowlingTeamId === teamId) {
        const bowlerEvents = inn.matchEvents.filter(
          (e) => e.bowlerId === playerId,
        );
        if (bowlerEvents.length === 0) return;

        const bowlerStats = calculateBowlerStats(bowlerEvents, playerId);

        totalRunsConceded += bowlerEvents.reduce(
          (sum, e) => sum + e.runBreakdown.bat + e.runBreakdown.extras,
          0,
        );
        totalBallsBowled += bowlerEvents.filter((e) => e.countsAsBall).length;

        totalDotBallsBowled += bowlerEvents.filter(
          (e) => e.countsAsBall && e.runBreakdown.bat === 0,
        ).length;
        totalFoursConceded += bowlerEvents.filter(
          (e) => e.runBreakdown.bat === 4,
        ).length;
        totalSixesConceded += bowlerEvents.filter(
          (e) => e.runBreakdown.bat === 6,
        ).length;

        totalWickets += bowlerStats.wickets;
        totalMaidens += bowlerStats.maidens;
        totalWides += bowlerStats.wides;
        totalNoBalls += bowlerStats.noBalls;
      }
    });
  });

  // -----------------
  // FINAL CALCS
  // -----------------
  // Batting
  const battingAverage =
    dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toFixed(2);
  const strikeRate =
    totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : "0.0";
  const dotBallPct =
    totalBalls > 0 ? ((totalDotBalls / totalBalls) * 100).toFixed(1) : "0.0";
  const foursPct =
    totalRuns > 0 ? (((totalFours * 4) / totalRuns) * 100).toFixed(1) : "0.0";
  const sixesPct =
    totalRuns > 0 ? (((totalSixes * 6) / totalRuns) * 100).toFixed(1) : "0.0";
  const boundaryRunsPct =
    totalRuns > 0
      ? (((totalFours * 4 + totalSixes * 6) / totalRuns) * 100).toFixed(1)
      : "0.0";
  const ballsPerBoundary =
    totalFours + totalSixes > 0
      ? (totalBalls / (totalFours + totalSixes)).toFixed(1)
      : "0.0";

  // Bowling
  const oversFormatted = `${Math.floor(totalBallsBowled / 6)}.${
    totalBallsBowled % 6
  }`;
  const economy =
    totalBallsBowled > 0
      ? ((totalRunsConceded / totalBallsBowled) * 6).toFixed(2)
      : "0.00";
  const bowlingAverage =
    totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : "0.0";
  const bowlingStrikeRate =
    totalWickets > 0 ? (totalBallsBowled / totalWickets).toFixed(1) : "0.0";
  const bowlingDotBallPct =
    totalBallsBowled > 0
      ? ((totalDotBallsBowled / totalBallsBowled) * 100).toFixed(1)
      : "0.0";
  const boundaryBallsPct =
    totalBallsBowled > 0
      ? (
          ((totalFoursConceded + totalSixesConceded) / totalBallsBowled) *
          100
        ).toFixed(1)
      : "0.0";

  return {
    batting: {
      matches: matchesPlayed,
      innings: inningsCount,
      runs: totalRuns,
      balls: totalBalls,
      dismissals,
      average: battingAverage,
      strikeRate,
      highestScore,
      dotBalls: totalDotBalls,
      dotBallPct,
      fours: totalFours,
      sixes: totalSixes,
      foursPct,
      sixesPct,
      boundaryRunsPct,
      ballsPerBoundary,
      notOuts,
      fifties,
      hundreds,
    },
    bowling: {
      matches: matchesPlayed,
      overs: oversFormatted,
      balls: totalBallsBowled,
      maidens: totalMaidens,
      runs: totalRunsConceded,
      wickets: totalWickets,
      economy,
      wides: totalWides,
      noBalls: totalNoBalls,
      average: bowlingAverage,
      strikeRate: bowlingStrikeRate,
      dotBalls: totalDotBallsBowled,
      dotBallPct: bowlingDotBallPct,
      foursConceded: totalFoursConceded,
      sixesConceded: totalSixesConceded,
      boundaryBallsPct,
    },
  };
}

/* =========================
   SEASON PLAYERS LIST
========================= */
interface SeasonPlayersParams {
  fixtures: Fixture[];
  team: Team;
  season: string;
}

export interface SeasonPlayerListItem {
  id: string;
  name: string;
}

export function getSeasonPlayers({
  fixtures,
  team,
  season,
}: SeasonPlayersParams): SeasonPlayerListItem[] {
  const seasonFixtures = fixtures.filter(
    (f) => f.season === season && f.yourTeam.id === team.id,
  );

  const playerIds = new Set<string>();

  seasonFixtures.forEach((fixture) => {
    if (!fixture.innings) return;

    const inningsArray = Array.isArray(fixture.innings)
      ? fixture.innings
      : Object.values(fixture.innings);

    inningsArray.forEach((inn) => {
      // Batting
      if (inn.battingTeamId === team.id) {
        inn.battingEntries.forEach((entry) => playerIds.add(entry.playerId));
      }
      // Bowling
      if (inn.bowlingTeamId === team.id) {
        inn.matchEvents.forEach((e) => {
          if (e.bowlerId) playerIds.add(e.bowlerId);
        });
      }
    });
  });

  return team.players
    .filter((p) => playerIds.has(p.id) && !p.archived)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
