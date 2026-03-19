import { Fixture, FixtureResult } from "../state/fixtureStore";

export function calculateFixtureResult(fixture: Fixture): FixtureResult {
  const teamTotals: Record<string, number> = {};
  const inningsByTeam: Record<string, number[]> = {};

  // 1️⃣ Sum totals & track innings breakdown
  fixture.innings.forEach((innings) => {
    const teamId = innings.battingTeamId;

    teamTotals[teamId] = (teamTotals[teamId] ?? 0) + innings.totalRuns;

    if (!inningsByTeam[teamId]) {
      inningsByTeam[teamId] = [];
    }

    inningsByTeam[teamId].push(innings.totalRuns);
  });

  const teamIds = Object.keys(teamTotals);

  // 🔹 Abandoned (no meaningful innings)
  if (fixture.abandoned) {
    return {
      type: "abandoned",
      teamTotals,
      isDraw: false,
      margin: "Match abandoned",
    };
  }

  if (teamIds.length < 2) {
    return {
      type: "draw",
      teamTotals,
      isDraw: true,
    };
  }

  const [teamA, teamB] = teamIds;
  const totalA = teamTotals[teamA];
  const totalB = teamTotals[teamB];

  // 🔹 Draw
  if (totalA === totalB) {
    return {
      type: "draw",
      teamTotals,
      isDraw: true,
      margin: "Match drawn",
    };
  }

  const winnerTeamId = totalA > totalB ? teamA : teamB;
  const loserTeamId = winnerTeamId === teamA ? teamB : teamA;

  const winningTotal = teamTotals[winnerTeamId];
  const losingTotal = teamTotals[loserTeamId];

  const marginRuns = Math.abs(winningTotal - losingTotal);

  const winnerInnings = inningsByTeam[winnerTeamId].length;
  const loserInnings = inningsByTeam[loserTeamId].length;

  // 🔥 INNINGS VICTORY
  // Winner scored more than opponent's TOTAL in a single innings format
  if (
    winnerInnings === 1 &&
    winnerInnings < loserInnings &&
    inningsByTeam[winnerTeamId][0] > losingTotal
  ) {
    return {
      type: "innings",
      teamTotals,
      winnerTeamId,
      isDraw: false,
      margin: `Won by an innings and ${marginRuns} runs`,
    };
  }

  // 🔥 WON BY WICKETS
  // Detect if final innings was chase and winner was batting last
  const lastInnings = fixture.innings[fixture.innings.length - 1];

  if (lastInnings.battingTeamId === winnerTeamId) {
    const wicketsRemaining = 10 - lastInnings.totalWickets;

    if (wicketsRemaining > 0) {
      return {
        type: "wickets",
        teamTotals,
        winnerTeamId,
        isDraw: false,
        margin: `Won by ${wicketsRemaining} wickets`,
      };
    }
  }

  // 🔹 Default = Won by runs
  return {
    type: "runs",
    teamTotals,
    winnerTeamId,
    isDraw: false,
    margin: `Won by ${marginRuns} runs`,
  };
}
