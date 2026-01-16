import { BallEvent, WicketEvent } from "../../state/matchStore";

export const wide = (runs = 0): BallEvent => ({
  type: "ball",
  runs,
  isExtra: true,
  extraType: "wide",
  countsAsBall: false,
});

export const noBall = (runs = 0): BallEvent => ({
  type: "ball",
  runs,
  isExtra: true,
  extraType: "noBall",
  countsAsBall: false,
});

export const bye = (runs = 1): BallEvent => ({
  type: "ball",
  runs,
  isExtra: true,
  extraType: "bye",
  countsAsBall: false,
});

export const legBye = (runs = 1): BallEvent => ({
  type: "ball",
  runs,
  isExtra: true,
  extraType: "legBye",
  countsAsBall: false,
});

export const run = (runs: number): BallEvent => ({
  type: "ball",
  runs,
  isExtra: false,
  countsAsBall: true,
});

export const wicket = (
  kind: "bowled" | "caught" | "runOut" | "stumped",
  options: Partial<WicketEvent> = {}
): WicketEvent => ({
  type: "wicket",
  kind,
  runs: 0,
  isExtra: false,
  countsAsBall: true,
  ...options,
});
