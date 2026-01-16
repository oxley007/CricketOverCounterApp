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
  legalBallsPerOver = 6,
  maxCircles = 10
): { circles: CircleItem[]; isFirstBall: boolean } {
  let legalBallCount = 0;
  let lastBoundaryIndex = 0; // end of previous over
  let latestBoundaryIndex = 0; // end of most recent over

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
  let overEvents = events.slice(overStartIndex);

  // STEP 4: count legal balls
  let legalCount = 0;
  for (const e of overEvents) {
    if (e && e.countsAsBall) legalCount++;
    if (legalCount === legalBallsPerOver) break;
  }

  // STEP 5: initial circles array
  let circles = overEvents.slice(0, legalCount + (overEvents.length - legalCount));

  // STEP 6: pad to LEGAL_BALLS (legal balls + extra wickets counted as legal)
  let actualLegalCount = circles.filter((e) => e && e.countsAsBall).length;

  const extraWicketBalls = circles.filter(
    (e) =>
      e &&
      e.type === "wicket" &&
      e.isExtra &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye"
  ).length;

  actualLegalCount += extraWicketBalls;

  while (actualLegalCount < legalBallsPerOver) {
    circles.push(null);
    actualLegalCount++;
  }

  // STEP 6b: add one empty circle for any extra delivery that isn't a legal ball
  const extraOnlyEvents = overEvents.filter(
    (e) =>
      e &&
      e.isExtra &&
      ( !e.countsAsBall || e.extraType === "noBall" ) && // include noBalls
      e.extraType !== "bye" &&
      e.extraType !== "legBye"
  );

  extraOnlyEvents.forEach(() => circles.push(null));

  // ✅ NEW STEP 6c: ensure enough circles for display
  // This guarantees we always have LEGAL_BALLS + all extras + some extra padding
  // STEP 6c: ensure enough circles for display
  // total circles = LEGAL_BALLS + all extra-only deliveries
  const targetLength = LEGAL_BALLS + extraOnlyEvents.length;
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

    circles = legalBalls;
  }

  // STEP 8: first-ball flag
  const isFirstBall = actualLegalCount === 1 && overEvents.length === 1;

  return { circles, isFirstBall };
}
