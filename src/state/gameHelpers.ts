// src/state/gameHelpers.ts
import type { BattingEntry, CurrentGame } from "./gameStore";
import type { MatchEvent } from "./matchStore";

export const getScorecard = (game?: CurrentGame) => {
  if (!game) return [];

  return game.battingEntries.map((entry) => {
    const strikeRate =
      entry.balls > 0 ? ((entry.runs / entry.balls) * 100).toFixed(1) : "0.0";

    return {
      ...entry,
      strikeRate,
      isNotOut: !entry.dismissal,
    };
  });
};

// Optional helper to format "How Out" column
export const getDismissalText = (entry: BattingEntry) => {
  if (!entry.dismissal) return "not out";

  const bowlerName = entry.dismissal.bowlerName ?? "";

  switch (entry.dismissal.kind) {
    case "bowled":
      return `b ${bowlerName}`;
    case "caught":
      return `c & b ${bowlerName}`;
    case "runOut":
      return "run out";
    default:
      return entry.dismissal.kind;
  }
};

export interface BowlerStats {
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: string;
  wides: number;
  noBalls: number;
}

export const calculateBowlerStats = (
  events: MatchEvent[],
  playerId: string,
): BowlerStats => {
  const bowlerEvents = events.filter((e) => e.bowlerId === playerId);

  const balls = bowlerEvents.filter((e) => e.countsAsBall).length;

  const runs = bowlerEvents.reduce((sum, e) => {
    const batRuns = e.runBreakdown?.bat || 0;

    const isBowlerExtra = e.extraType === "wide" || e.extraType === "noBall";

    const extraRuns = isBowlerExtra ? e.runBreakdown?.extras || 0 : 0;

    return sum + batRuns + extraRuns; // ✅ byes/legByes ignored
  }, 0);

  const wickets = bowlerEvents.filter((e) => e.type === "wicket").length;
  const wides = bowlerEvents.filter((e) => e.extraType === "wide").length;
  const noBalls = bowlerEvents.filter((e) => e.extraType === "noBall").length;

  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

  // Maidens
  let maidens = 0;
  let ballInOver = 0;
  let runsInOver = 0;

  bowlerEvents.forEach((e) => {
    if (e.countsAsBall) {
      runsInOver += e.runs || 0;
      ballInOver++;

      if (ballInOver === 6) {
        if (runsInOver === 0) maidens++;
        ballInOver = 0;
        runsInOver = 0;
      }
    }
  });

  const oversDecimal = balls / 6;
  const economy = oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : "0.00";

  return { overs, maidens, runs, wickets, economy, wides, noBalls };
};
