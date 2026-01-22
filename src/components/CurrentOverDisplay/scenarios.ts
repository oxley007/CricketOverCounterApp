// components/CurrentOverDisplay/scenarios.ts
import { WicketEvent } from "../../state/matchStore";

/**
 * Wicket + extras + runs scenarios for BallCircle tests
 * Covers:
 * - Plain wickets (0 runs, no extra)
 * - Positive runs (+1, +2)
 * - Negative runs (for wicketAsNegativeBall)
 * - Extras (wide, noBall)
 * - Combinations
 */
export const wicketExtraScenarios: WicketEvent[] = [
  // ------------------------
  // 1. Plain wickets (0 runs, no extra)
  // ------------------------
  { type: "wicket", kind: "bowled", runs: 0, isExtra: false, extraType: undefined, countsAsBall: true },
  { type: "wicket", kind: "caught", runs: 0, isExtra: false, extraType: undefined, countsAsBall: true },
  { type: "wicket", kind: "runOut", runs: 0, isExtra: false, extraType: undefined, countsAsBall: true },
  { type: "wicket", kind: "stumped", runs: 0, isExtra: false, extraType: undefined, countsAsBall: true },

  // ------------------------
  // 2. Wickets + positive runs
  // ------------------------
  { type: "wicket", kind: "bowled", runs: 1, isExtra: false, extraType: undefined, countsAsBall: true },
  { type: "wicket", kind: "caught", runs: 2, isExtra: false, extraType: undefined, countsAsBall: true },

  // ------------------------
  // 3. Wickets + negative runs (wicketAsNegativeBall)
  // ------------------------
  { type: "ball", kind: "bowled", runs: -1, isExtra: false, extraType: undefined, countsAsBall: true },
  { type: "ball", kind: "bowled", runs: -5, isExtra: false, extraType: undefined, countsAsBall: true },

  // ------------------------
  // 4. Wickets + extras only
  // ------------------------
  { type: "wicket", kind: "stumped", runs: 0, isExtra: true, extraType: "wide", countsAsBall: false },
  { type: "wicket", kind: "runOut", runs: 0, isExtra: true, extraType: "noBall", countsAsBall: false },

  // ------------------------
  // 5. Wickets + runs + extras
  // ------------------------
  { type: "wicket", kind: "stumped", runs: 1, isExtra: true, extraType: "wide", countsAsBall: false },
  { type: "wicket", kind: "runOut", runs: 2, isExtra: true, extraType: "noBall", countsAsBall: false },
  { type: "wicket", kind: "bowled", runs: 0, isExtra: true, extraType: "noBall", countsAsBall: false },
];
