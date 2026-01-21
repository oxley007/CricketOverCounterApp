import { BallEvent, WicketEvent } from "../../state/matchStore";

let nextId = 1;
const makeId = () => `event-${nextId++}`;
const now = () => Date.now();
const emptyRunBreakdown = { bat: 0, extras: 0 };

// Ball factories
export const wide = (runs = 0): BallEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "ball",
  runs,
  isExtra: true,
  extraType: "wide",
  countsAsBall: false,
});

export const noBall = (runs = 0): BallEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "ball",
  runs,
  isExtra: true,
  extraType: "noBall",
  countsAsBall: false,
});

export const bye = (runs = 1): BallEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "ball",
  runs,
  isExtra: true,
  extraType: "bye",
  countsAsBall: false,
});

export const legBye = (runs = 1): BallEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "ball",
  runs,
  isExtra: true,
  extraType: "legBye",
  countsAsBall: false,
});

export const run = (runs: number): BallEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "ball",
  runs,
  isExtra: false,
  countsAsBall: true,
});

// Wicket factory
export const wicket = (
  kind: WicketEvent["kind"],
  options: Partial<WicketEvent> = {}
): WicketEvent => ({
  id: makeId(),
  timestamp: now(),
  runBreakdown: emptyRunBreakdown,
  type: "wicket",
  kind,
  runs: 0,
  isExtra: false,
  countsAsBall: true,
  ...options,
});
