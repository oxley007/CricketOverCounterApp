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
    highestScorerName?: string;
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

export interface SeasonTeamStats extends SeasonPlayerStats {}

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
    (f) => f.season === season && f.yourTeam?.id === team.id,
  );

  const playerIds = new Set<string>();

  seasonFixtures.forEach((fixture) => {
    const inningsArray = Array.isArray(fixture.innings)
      ? fixture.innings
      : fixture.innings
        ? Object.values(fixture.innings)
        : [];

    inningsArray.forEach((inn) => {
      // Batting
      if (inn.battingTeamId === team.id && Array.isArray(inn.battingEntries)) {
        inn.battingEntries.forEach((entry) => playerIds.add(entry.playerId));
      }
      // Bowling
      if (inn.bowlingTeamId === team.id && Array.isArray(inn.matchEvents)) {
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

/* =========================
   SEASON TEAM STATS
========================= */
// src/state/seasonStatsHelpers.ts

interface SeasonTeamStatsParams {
  fixtures: Fixture[];
  team: Team; // pass team directly
  season: string;
}

export function getSeasonTeamStats({
  fixtures,
  team,
  season,
}: SeasonTeamStatsParams): SeasonTeamStats | null {
  if (!team) return null; // guard for undefined team

  // Filter fixtures for this season and team
  const seasonFixtures = fixtures.filter(
    (f) => f.season === season && f.yourTeam?.id === team.id,
  );

  // ================= BAT & BOWL ACCUMULATORS =================
  let totalMatches = 0;
  let totalInnings = 0;
  let totalRuns = 0;
  let totalBalls = 0;
  let totalDismissals = 0;
  let highestScore = 0;
  let highestScorerName = "";
  let totalDotBalls = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let totalNotOuts = 0;
  let totalFifties = 0;
  let totalHundreds = 0;

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
    if (!fixture.innings) return; // skip fixtures with no innings

    const inningsArray = Array.isArray(fixture.innings)
      ? fixture.innings
      : Object.values(fixture.innings);

    let matchHasPlayers = false;

    inningsArray.forEach((inn) => {
      // ================= BATTING =================
      if (inn.battingTeamId === team.id && Array.isArray(inn.battingEntries)) {
        if (inn.battingEntries.length > 0) matchHasPlayers = true;

        inn.battingEntries.forEach((entry) => {
          const playerEvents = Array.isArray(inn.matchEvents)
            ? inn.matchEvents.filter((e) => e.batterInningId === entry.entryId)
            : [];

          const runsScored = playerEvents.reduce(
            (sum, e) => sum + (e.runBreakdown?.bat || 0),
            0,
          );
          totalRuns += runsScored;

          // Lookup player name from team safely
          const player = team.players?.find((p) => p.id === entry.playerId);
          if (runsScored > highestScore) {
            highestScore = runsScored;
            highestScorerName = player?.name ?? "";
          }

          const ballsFaced = playerEvents.filter((e) => e.countsAsBall).length;
          totalBalls += ballsFaced;

          totalDotBalls += playerEvents.filter(
            (e) => e.countsAsBall && (e.runBreakdown?.bat || 0) === 0,
          ).length;

          totalFours += playerEvents.filter(
            (e) => e.runBreakdown?.bat === 4,
          ).length;
          totalSixes += playerEvents.filter(
            (e) => e.runBreakdown?.bat === 6,
          ).length;

          if (entry.dismissal) totalDismissals++;
          else totalNotOuts++;

          if (runsScored >= 50 && runsScored < 100) totalFifties++;
          if (runsScored >= 100) totalHundreds++;

          totalInnings++;
        });
      }

      // ================= BOWLING =================
      if (inn.bowlingTeamId === team.id && Array.isArray(inn.matchEvents)) {
        const bowlerEvents = inn.matchEvents.filter((e) => e.bowlerId);
        if (bowlerEvents.length > 0) matchHasPlayers = true;

        const bowlerStats = calculateBowlerStats(bowlerEvents, "team");

        totalRunsConceded += bowlerEvents.reduce(
          (sum, e) =>
            sum + (e.runBreakdown?.bat || 0) + (e.runBreakdown?.extras || 0),
          0,
        );

        totalBallsBowled += bowlerEvents.filter((e) => e.countsAsBall).length;

        totalDotBallsBowled += bowlerEvents.filter(
          (e) => e.countsAsBall && (e.runBreakdown?.bat || 0) === 0,
        ).length;

        totalFoursConceded += bowlerEvents.filter(
          (e) => e.runBreakdown?.bat === 4,
        ).length;
        totalSixesConceded += bowlerEvents.filter(
          (e) => e.runBreakdown?.bat === 6,
        ).length;

        totalWickets += bowlerEvents.filter((e) => e.wicket).length;

        totalMaidens += bowlerStats.maidens;
        totalWides += bowlerStats.wides;
        totalNoBalls += bowlerStats.noBalls;
      }
    });

    if (matchHasPlayers) totalMatches++;
  });

  // ================= BAT & BOWL FINAL STATS =================
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

  const overs = `${Math.floor(totalBallsBowled / 6)}.${totalBallsBowled % 6}`;
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
      matches: totalMatches,
      innings: totalInnings,
      runs: totalRuns,
      balls: totalBalls,
      dismissals: totalDismissals,
      strikeRate,
      highestScore,
      highestScorerName,
      dotBalls: totalDotBalls,
      dotBallPct,
      fours: totalFours,
      sixes: totalSixes,
      foursPct,
      sixesPct,
      boundaryRunsPct,
      ballsPerBoundary,
      notOuts: totalNotOuts,
      fifties: totalFifties,
      hundreds: totalHundreds,
    },
    bowling: {
      matches: totalMatches,
      overs,
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
   SEASON PLAYER STATS
========================= */
export function getSeasonPlayerStats({
  fixtures,
  teamId,
  season,
  playerId,
}: SeasonPlayerStatsParams): SeasonPlayerStats {
  const seasonFixtures = fixtures.filter(
    (f) => f.season === season && f.yourTeam?.id === teamId,
  );

  let matches = 0;
  let innings = 0;

  let runs = 0;
  let balls = 0;
  let dismissals = 0;
  let highestScore = 0;
  let dotBalls = 0;
  let fours = 0;
  let sixes = 0;
  let notOuts = 0;
  let fifties = 0;
  let hundreds = 0;

  let ballsBowled = 0;
  let runsConceded = 0;
  let wickets = 0;
  let maidens = 0;
  let wides = 0;
  let noBalls = 0;
  let dotBallsBowled = 0;
  let foursConceded = 0;
  let sixesConceded = 0;

  seasonFixtures.forEach((fixture) => {
    const inningsArray = Array.isArray(fixture.innings)
      ? fixture.innings
      : fixture.innings
        ? Object.values(fixture.innings)
        : [];

    let playedMatch = false;

    inningsArray.forEach((inn) => {
      /* ================= BATTING ================= */
      if (inn.battingTeamId === teamId && Array.isArray(inn.battingEntries)) {
        const entry = inn.battingEntries.find((e) => e.playerId === playerId);
        if (entry) {
          playedMatch = true;
          innings++;

          const events = Array.isArray(inn.matchEvents)
            ? inn.matchEvents.filter((e) => e.batterInningId === entry.entryId)
            : [];

          const runsScored = events.reduce(
            (sum, e) => sum + (e.runBreakdown?.bat || 0),
            0,
          );

          runs += runsScored;
          const ballsFaced = events.filter((e) => e.countsAsBall).length;
          balls += ballsFaced;

          dotBalls += events.filter(
            (e) => e.countsAsBall && (e.runBreakdown?.bat || 0) === 0,
          ).length;

          fours += events.filter((e) => e.runBreakdown?.bat === 4).length;
          sixes += events.filter((e) => e.runBreakdown?.bat === 6).length;

          if (entry.dismissal) dismissals++;
          else notOuts++;

          if (runsScored > highestScore) highestScore = runsScored;
          if (runsScored >= 50 && runsScored < 100) fifties++;
          if (runsScored >= 100) hundreds++;
        }
      }

      /* ================= BOWLING ================= */
      if (inn.bowlingTeamId === teamId && Array.isArray(inn.matchEvents)) {
        const bowlerEvents = inn.matchEvents.filter(
          (e) => e.bowlerId === playerId,
        );
        if (bowlerEvents.length > 0) {
          playedMatch = true;

          const bowlerStats = calculateBowlerStats(bowlerEvents, playerId);

          ballsBowled += bowlerEvents.filter((e) => e.countsAsBall).length;

          runsConceded += bowlerEvents.reduce(
            (sum, e) =>
              sum + (e.runBreakdown?.bat || 0) + (e.runBreakdown?.extras || 0),
            0,
          );

          wickets += bowlerEvents.filter((e) => e.wicket).length;

          dotBallsBowled += bowlerEvents.filter(
            (e) => e.countsAsBall && (e.runBreakdown?.bat || 0) === 0,
          ).length;

          foursConceded += bowlerEvents.filter(
            (e) => e.runBreakdown?.bat === 4,
          ).length;
          sixesConceded += bowlerEvents.filter(
            (e) => e.runBreakdown?.bat === 6,
          ).length;

          maidens += bowlerStats.maidens;
          wides += bowlerStats.wides;
          noBalls += bowlerStats.noBalls;
        }
      }
    });

    if (playedMatch) matches++;
  });

  const battingAverage =
    dismissals > 0 ? (runs / dismissals).toFixed(2) : runs.toFixed(2);
  const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
  const dotBallPct = balls > 0 ? ((dotBalls / balls) * 100).toFixed(1) : "0.0";
  const foursPct = runs > 0 ? (((fours * 4) / runs) * 100).toFixed(1) : "0.0";
  const sixesPct = runs > 0 ? (((sixes * 6) / runs) * 100).toFixed(1) : "0.0";
  const boundaryRunsPct =
    runs > 0 ? (((fours * 4 + sixes * 6) / runs) * 100).toFixed(1) : "0.0";
  const ballsPerBoundary =
    fours + sixes > 0 ? (balls / (fours + sixes)).toFixed(1) : "0.0";

  const overs = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
  const economy =
    ballsBowled > 0 ? ((runsConceded / ballsBowled) * 6).toFixed(2) : "0.00";
  const bowlingAverage =
    wickets > 0 ? (runsConceded / wickets).toFixed(2) : "0.0";
  const bowlingStrikeRate =
    wickets > 0 ? (ballsBowled / wickets).toFixed(1) : "0.0";
  const bowlingDotBallPct =
    ballsBowled > 0 ? ((dotBallsBowled / ballsBowled) * 100).toFixed(1) : "0.0";
  const boundaryBallsPct =
    ballsBowled > 0
      ? (((foursConceded + sixesConceded) / ballsBowled) * 100).toFixed(1)
      : "0.0";

  return {
    batting: {
      matches,
      innings,
      runs,
      balls,
      dismissals,
      average: battingAverage,
      strikeRate,
      highestScore,
      dotBalls,
      dotBallPct,
      fours,
      sixes,
      foursPct,
      sixesPct,
      boundaryRunsPct,
      ballsPerBoundary,
      notOuts,
      fifties,
      hundreds,
    },
    bowling: {
      matches,
      overs,
      balls: ballsBowled,
      maidens,
      runs: runsConceded,
      wickets,
      economy,
      wides,
      noBalls,
      average: bowlingAverage,
      strikeRate: bowlingStrikeRate,
      dotBalls: dotBallsBowled,
      dotBallPct: bowlingDotBallPct,
      foursConceded,
      sixesConceded,
      boundaryBallsPct,
    },
  };
}
