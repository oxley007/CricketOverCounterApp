// src/state/gameHelpers.ts
import type { CurrentGame } from "./gameStore";
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
export const getDismissalText = (entry: any) => {
  // 1. Log the entry to see what data the function is actually receiving
  console.log(
    "DEBUG: Entry ID:",
    entry.entryId || entry.playerId,
    "Full Entry:",
    JSON.stringify(entry),
  );

  const dismissal = entry.dismissal || entry.wicket || entry;

  if (!dismissal || !dismissal.kind) {
    console.log("DEBUG: No dismissal/kind found for this entry");
    return "not out";
  }

  const kind = dismissal.kind.toLowerCase();
  console.log("DEBUG: Detected kind:", kind);

  switch (kind) {
    case "bowled":
      return "bwld";
    case "caught":
      return "cght";
    case "runout":
    case "run out":
      return "r.o";
    case "lbw":
      return "lbw";
    case "stumped":
      return "stmp";
    case "hitwicket":
    case "hit wicket":
      return "h.w";
    case "retired":
      return "retired";
    default:
      console.log("DEBUG: Hit default case for kind:", kind);
      return kind;
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
      return e.wicketPenaltyWicketType !== "runout";
    }

    if (e.type === "wicket" && e.kind) {
      return e.kind !== "runout" && e.kind !== "partnership";
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
