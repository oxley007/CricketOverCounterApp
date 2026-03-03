import type { Fixture } from "./fixtureStore";
import { calculateBatterStats, calculateBowlerStats } from "./gameHelpers";
import type { MatchEvent } from "./matchStore";

import type { Team } from "./teamStore";

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
  };
}

export function getSeasonPlayerStats({
  fixtures,
  teamId,
  season,
  playerId,
}: SeasonPlayerStatsParams): SeasonPlayerStats {
  const seasonFixtures = fixtures.filter(
    (f) => f.season === season && f.yourTeam.id === teamId,
  );

  /* =========================
     MATCH COUNT
  ========================= */

  const matchesPlayed = seasonFixtures.filter((f) =>
    f.innings.some(
      (inn) =>
        inn.battingEntries.some((e) => e.playerId === playerId) ||
        inn.matchEvents.some((e) => e.bowlerId === playerId),
    ),
  ).length;

  /* =========================
     BATTING
  ========================= */

  let inningsCount = 0;
  let totalRuns = 0;
  let totalBalls = 0;
  let dismissals = 0;
  let highestScore = 0;

  /* =========================
     BOWLING
  ========================= */

  let totalBallsBowled = 0;
  let totalRunsConceded = 0;
  let totalWickets = 0;
  let totalMaidens = 0;
  let totalWides = 0;
  let totalNoBalls = 0;

  seasonFixtures.forEach((fixture) => {
    fixture.innings.forEach((inn) => {
      /* ===== BATTING ===== */

      if (inn.battingTeamId === teamId) {
        const playerEntries = inn.battingEntries.filter(
          (e) => e.playerId === playerId,
        );

        playerEntries.forEach((entry) => {
          inningsCount++;

          const batterStats = calculateBatterStats(
            inn.matchEvents as MatchEvent[],
            playerId,
            entry.entryId,
          );

          totalRuns += batterStats.runs;
          totalBalls += batterStats.balls;

          if (entry.dismissal) dismissals++;

          if (batterStats.runs > highestScore) {
            highestScore = batterStats.runs;
          }
        });
      }

      /* ===== BOWLING ===== */

      if (inn.bowlingTeamId === teamId) {
        const playerBowled = inn.matchEvents.some(
          (e) => e.bowlerId === playerId,
        );

        if (playerBowled) {
          const bowlerStats = calculateBowlerStats(
            inn.matchEvents as MatchEvent[],
            playerId,
          );

          const balls =
            parseInt(bowlerStats.overs.split(".")[0]) * 6 +
            parseInt(bowlerStats.overs.split(".")[1]);

          totalBallsBowled += balls;
          totalRunsConceded += bowlerStats.runs;
          totalWickets += bowlerStats.wickets;
          totalMaidens += bowlerStats.maidens;
          totalWides += bowlerStats.wides;
          totalNoBalls += bowlerStats.noBalls;
        }
      }
    });
  });

  /* =========================
     FINAL CALCS
  ========================= */

  const battingAverage =
    dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toFixed(2);

  const strikeRate =
    totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : "0.0";

  const oversFormatted = `${Math.floor(totalBallsBowled / 6)}.${
    totalBallsBowled % 6
  }`;

  const economy =
    totalBallsBowled > 0
      ? ((totalRunsConceded / totalBallsBowled) * 6).toFixed(2)
      : "0.00";

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
    },
  };
}

interface SeasonPlayersParams {
  fixtures: Fixture[];
  team: Team; // pass the actual team object from teamStore
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
    fixture.innings.forEach((inn) => {
      // Batting appearances
      if (inn.battingTeamId === team.id) {
        inn.battingEntries.forEach((entry) => {
          playerIds.add(entry.playerId);
        });
      }

      // Bowling appearances
      if (inn.bowlingTeamId === team.id) {
        inn.matchEvents.forEach((e) => {
          if (e.bowlerId) {
            playerIds.add(e.bowlerId);
          }
        });
      }
    });
  });

  // Map IDs to player names from teamStore
  const players = team.players
    .filter((p) => playerIds.has(p.id) && !p.archived)
    .map((p) => ({
      id: p.id,
      name: p.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return players;
}
