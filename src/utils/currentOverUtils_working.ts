import { BallEvent, WicketEvent } from "../state/matchStore";

const LEGAL_BALLS = 6;
const MAX_CIRCLES = 10;

export type CircleItem =
  | BallEvent
  | WicketEvent
  | null
  | { extraCount: number };

export function buildCurrentOverCircles(
  events: (BallEvent | WicketEvent)[],
  legalBallsPerOver = LEGAL_BALLS,
  maxCircles = MAX_CIRCLES
): { circles: CircleItem[]; isFirstBall: boolean } {
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

    const isExtraDisplay =
      e.isExtra &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye";

    // Push legal balls
    if (e.countsAsBall) {
      circles.push(e);
      actualLegalCount++;
    }
    // Push extras that need a display circle (including noBall+wicket)
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
      e.extraType !== "legBye"
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
        e.extraType !== "legBye";

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
