// src/utils/__tests__/scenarios.ts
import { WicketEvent } from "../../state/matchStore";

export const wicketExtraScenarios: WicketEvent[] = [
  {
    type: "wicket",
    kind: "stumped",
    runs: 1,
    isExtra: true,
    extraType: "wide",
    countsAsBall: false,
  },
  {
    type: "wicket",
    kind: "stumped",
    runs: 0,
    isExtra: true,
    extraType: "wide",
    countsAsBall: false,
  },
  {
    type: "wicket",
    kind: "runOut",
    runs: 2,
    isExtra: true,
    extraType: "noBall",
    countsAsBall: false,
  },
  {
    type: "wicket",
    kind: "bowled",
    runs: 0,
    isExtra: true,
    extraType: "noBall",
    countsAsBall: false,
  },
  {
    type: "wicket",
    kind: "runOut",
    runs: 1,
    isExtra: false,
    extraType: null,
    countsAsBall: true,
  },
  {
    type: "wicket",
    kind: "caught",
    runs: 0,
    isExtra: false,
    extraType: null,
    countsAsBall: true,
  },
];
