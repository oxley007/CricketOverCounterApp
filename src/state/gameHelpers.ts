// src/state/gameHelpers.ts
import type { BattingEntry, CurrentGame } from "./gameStore";

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
