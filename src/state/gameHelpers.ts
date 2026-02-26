// src/state/gameHelpers.ts
import type { BattingEntry, CurrentGame } from "./gameStore";
import type { MatchEvent } from "./matchStore";
import { matchStoreRef } from "./matchStore";

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
  const { wideIsExtraBall, wideExtraBallThreshold } = matchStoreRef.getState();

  const bowlerEvents = events.filter((e) => e.bowlerId === playerId);

  /* =========================
     BALLS (threshold aware)
  ========================= */

  let balls = 0;
  let widesThisOver = 0;

  bowlerEvents.forEach((e) => {
    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? widesThisOver >= wideExtraBallThreshold
        : !wideIsExtraBall;

    const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

    if (countsAsLegal) {
      balls++;

      if (balls % 6 === 0) {
        widesThisOver = 0; // reset per over
      }
    }

    if (isWide) {
      widesThisOver++;
    }
  });

  /* =========================
     RUNS (unchanged)
  ========================= */

  const runs = bowlerEvents.reduce((sum, e) => {
    const batRuns = e.runBreakdown?.bat ?? 0;

    const isBowlerExtra = e.extraType === "wide" || e.extraType === "noBall";

    const extraRuns = isBowlerExtra ? (e.runBreakdown?.extras ?? 0) : 0;

    const wicketPenaltyAddBack = e.wicketPenaltyAdditionBowler ?? 0;

    return sum + batRuns + extraRuns + wicketPenaltyAddBack;
  }, 0);

  /* =========================
     WICKETS (unchanged)
  ========================= */

  const wickets = bowlerEvents.filter((e) => {
    if (e.wicketPenaltyWicketType) {
      return e.wicketPenaltyWicketType !== "Run Out";
    }

    if (e.type === "wicket" && e.kind) {
      return e.kind !== "Run Out";
    }

    return false;
  }).length;

  const wides = bowlerEvents.filter((e) => e.extraType === "wide").length;

  const noBalls = bowlerEvents.filter((e) => e.extraType === "noBall").length;

  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

  /* =========================
     MAIDENS (threshold aware)
  ========================= */

  let maidens = 0;
  let ballInOver = 0;
  let runsInOver = 0;
  let maidenWides = 0;

  bowlerEvents.forEach((e) => {
    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? maidenWides >= wideExtraBallThreshold
        : !wideIsExtraBall;

    const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

    if (countsAsLegal) {
      const batRuns = e.runBreakdown?.bat ?? 0;

      const isBowlerExtra = e.extraType === "wide" || e.extraType === "noBall";

      const extraRuns = isBowlerExtra ? (e.runBreakdown?.extras ?? 0) : 0;

      const wicketPenaltyAddBack = e.wicketPenaltyAdditionBowler ?? 0;

      runsInOver += batRuns + extraRuns + wicketPenaltyAddBack;
      ballInOver++;

      if (ballInOver === 6) {
        if (runsInOver === 0) maidens++;

        ballInOver = 0;
        runsInOver = 0;
        maidenWides = 0; // reset per over
      }
    }

    if (isWide) {
      maidenWides++;
    }
  });

  /* =========================
     ECONOMY
  ========================= */

  const oversDecimal = balls / 6;
  const economy = oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : "0.00";

  return {
    overs,
    maidens,
    runs,
    wickets,
    economy,
    wides,
    noBalls,
  };
};

export interface BatterStats {
  runs: number;
  balls: number;
  strikeRate: string;
}

export const calculateBatterStats = (
  events: MatchEvent[],
  playerId: string,
  batterInningId?: string,
): BatterStats => {
  const eventsForBatter = events.filter(
    (e) =>
      e.batterId === playerId &&
      (!batterInningId || e.batterInningId === batterInningId),
  );

  const runs = eventsForBatter.reduce((sum, e) => {
    const batRuns = e.runBreakdown?.bat ?? 0;
    const penaltyAddBack = e.wicketPenaltyAdditionBatter ?? 0;

    return sum + batRuns + penaltyAddBack;
  }, 0);

  const balls = eventsForBatter.filter((e) => e.countsAsBall).length;

  const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

  return { runs, balls, strikeRate };
};
