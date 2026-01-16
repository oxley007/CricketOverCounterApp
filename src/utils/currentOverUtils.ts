import { BallEvent, WicketEvent, useMatchStore } from "../state/matchStore";

const LEGAL_BALLS = 6;
const MAX_CIRCLES = 10;

export type CircleItem =
  | BallEvent
  | WicketEvent
  | null
  | { extraCount: number };

  type OverRules = {
    wideIsExtraBall: boolean;
  };

export function buildCurrentOverCircles(
  events: (BallEvent | WicketEvent)[],
    rules: OverRules,
    legalBallsPerOver = LEGAL_BALLS,
    maxCircles = MAX_CIRCLES
): { circles: CircleItem[]; isFirstBall: boolean } {
  //const { wideIsExtraBall } = useMatchStore.getState(); // ✅ only added this
  const { wideIsExtraBall } = rules;

  let legalBallCount = 0;
  let lastBoundaryIndex = 0;
  let latestBoundaryIndex = 0;

  // STEP 1: track over boundaries
  for (let i = 0; i < events.length; i++) {
    if (events[i].countsAsBall) {
      legalBallCount++;
      if (legalBallCount % legalBallsPerOver === 0) {
        lastBoundaryIndex = latestBoundaryIndex;
        latestBoundaryIndex = i + 1;
      }
    }
  }

  // STEP 2: decide which over to show
  const hasStartedNextOver = latestBoundaryIndex < events.length;
  const overStartIndex = hasStartedNextOver ? latestBoundaryIndex : lastBoundaryIndex;

  // STEP 3: slice current over events
  const overEvents = events.slice(overStartIndex);

  // STEP 4: build circles array
  const circles: CircleItem[] = [];
  let actualLegalCount = 0;

  overEvents.forEach((e) => {
    if (!e) return;

    const isWide = e.extraType === "wide";
    const isExtraDisplay =
      e.isExtra &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye" &&
      !(isWide && !wideIsExtraBall); // hide circle if wide counts as legal

    // Push legal balls
    if (e.countsAsBall || (isWide && !wideIsExtraBall)) {
      circles.push(e);
      actualLegalCount++; // ✅ increment legal count for overs
    }
    // Push extras that need a display circle
    else if (isExtraDisplay) {
      circles.push(e);
    }

    // Count extra wickets as legal balls
    if (
      e.type === "wicket" &&
      e.isExtra &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye"
    ) {
      actualLegalCount++;
    }
  });

  // STEP 5: calculate target length for padding
  const extraOnlyEventsCount = overEvents.filter(
    (e) =>
      e &&
      e.isExtra &&
      !e.countsAsBall &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye" &&
      !(e.extraType === "wide" && !wideIsExtraBall) // ✅ also skip here
  ).length;

  const targetLength = Math.max(LEGAL_BALLS, actualLegalCount) + extraOnlyEventsCount;

  // STEP 6: pad exactly to target length
  while (circles.length < targetLength) {
    circles.push(null);
  }

  // STEP 7: handle overflow
  if (circles.length > maxCircles) {
    let totalExtras = 0;
    const legalBalls: CircleItem[] = [];
    let legalSeen = 0;

    for (const e of circles) {
      if (!e) continue;

      const isCountedExtra =
        (e.type === "ball" || e.type === "wicket") &&
        e.isExtra &&
        e.extraType !== "bye" &&
        e.extraType !== "legBye" &&
        !(e.extraType === "wide" && !wideIsExtraBall); // ✅ skip wides here too

      if (isCountedExtra) {
        totalExtras += Math.abs(e.runs || 0);
      } else if (e.countsAsBall) {
        if (legalSeen < legalBallsPerOver) {
          legalBalls.push(e);
          legalSeen++;
        }
      }
    }

    while (legalBalls.length < legalBallsPerOver) legalBalls.push(null);

    if (totalExtras > 0) legalBalls.push({ extraCount: totalExtras });

    circles.splice(0, circles.length, ...legalBalls);
  }

  // STEP 8: first-ball flag
  const isFirstBall = actualLegalCount === 1 && overEvents.length === 1;

  return { circles, isFirstBall };
}
