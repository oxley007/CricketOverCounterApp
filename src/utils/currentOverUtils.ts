import { BallEvent, WicketEvent, matchStoreRef } from "../state/matchStore";

export type { BallEvent, WicketEvent };

const LEGAL_BALLS = 6;
const MAX_CIRCLES = 10;

export type CircleItem =
  | BallEvent
  | WicketEvent
  | null
  | { extraCount: number };

export function buildCurrentOverCircles(
  events: (BallEvent | WicketEvent)[],
  rules: { wideIsExtraBall: boolean },
  legalBallsPerOver = LEGAL_BALLS,
  maxCircles = MAX_CIRCLES,
): { circles: CircleItem[]; isFirstBall: boolean; ballsThisOver: number } {
  const { wideIsExtraBall, wideExtraBallThreshold } = matchStoreRef.getState();

  console.log("wideExtraBallThreshold:", wideExtraBallThreshold);

  /* =====================================================
     STEP 1: FIND LAST COMPLETE OVER INDEX (threshold aware)
  ===================================================== */

  let legalBallCounter = 0;
  let lastCompleteOverIndex = 0;
  let widesThisOver = 0;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e) continue;

    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? widesThisOver >= wideExtraBallThreshold
        : !wideIsExtraBall;

    const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

    if (countsAsLegal) {
      legalBallCounter++;

      if (legalBallCounter % legalBallsPerOver === 0) {
        lastCompleteOverIndex = i + 1;
        widesThisOver = 0; // ✅ reset per over
      }
    }

    if (isWide) {
      widesThisOver++;
    }
  }

  /* =====================================================
     STEP 2: DETERMINE START INDEX FOR DISPLAY
  ===================================================== */

  let overStartIndex: number;

  if (events.length > lastCompleteOverIndex) {
    overStartIndex = lastCompleteOverIndex;
  } else {
    let tempCount = 0;
    let tempWides = 0;

    for (let i = lastCompleteOverIndex - 1; i >= 0; i--) {
      const e = events[i];
      if (!e) continue;

      const isWide = e.extraType === "wide";

      const wideCountsAsLegal =
        wideExtraBallThreshold > 0
          ? tempWides >= wideExtraBallThreshold
          : !wideIsExtraBall;

      const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

      if (countsAsLegal) tempCount++;

      if (isWide) tempWides++;

      if (tempCount === legalBallsPerOver) {
        overStartIndex = i;
        break;
      }
    }

    if (overStartIndex === undefined) overStartIndex = 0;
  }

  /* =====================================================
     STEP 3: SLICE CURRENT OVER EVENTS
  ===================================================== */

  const overEvents = events.slice(overStartIndex);

  /* =====================================================
     STEP 4: BUILD CIRCLES (threshold aware)
  ===================================================== */

  const circles: CircleItem[] = [];
  let actualLegalCount = 0;
  let ballsForOverDisplay = 0;
  let overWides = 0;

  overEvents.forEach((e) => {
    if (!e || "extraCount" in e) return;

    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? overWides >= wideExtraBallThreshold
        : !wideIsExtraBall;

    const canCountBall = ballsForOverDisplay < legalBallsPerOver;

    const countsForCircles =
      (e.countsAsBall || (isWide && wideCountsAsLegal)) && canCountBall;

    const isExtraDisplay = e.isExtra && !(isWide && wideCountsAsLegal);

    if (countsForCircles) {
      circles.push(e);
      actualLegalCount++;
      ballsForOverDisplay++;
    } else if (isExtraDisplay) {
      circles.push(e);
    }

    if (
      e.type === "wicket" &&
      e.isExtra &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye" &&
      e.countsAsBall &&
      ballsForOverDisplay < legalBallsPerOver
    ) {
      actualLegalCount++;
      ballsForOverDisplay++;
    }

    if (isWide) overWides++;
  });

  /* =====================================================
     STEP 5: PADDING & OVERFLOW
  ===================================================== */

  let extraOnlyEventsCount = 0;
  let filterWides = 0;

  overEvents.forEach((e) => {
    if (!e) return;

    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? filterWides >= wideExtraBallThreshold
        : !wideIsExtraBall;

    if (
      e.isExtra &&
      !e.countsAsBall &&
      e.extraType !== "bye" &&
      e.extraType !== "legBye" &&
      !(isWide && wideCountsAsLegal)
    ) {
      extraOnlyEventsCount++;
    }

    if (isWide) filterWides++;
  });

  const targetLength =
    Math.max(LEGAL_BALLS, actualLegalCount) + extraOnlyEventsCount;

  while (circles.length < targetLength) circles.push(null);

  if (circles.length > maxCircles) {
    let totalExtras = 0;
    const legalBalls: CircleItem[] = [];
    let legalSeen = 0;
    let reduceWides = 0;

    for (const e of circles) {
      if (!e || "extraCount" in e) continue;

      const isWide = e.extraType === "wide";

      const wideCountsAsLegal =
        wideExtraBallThreshold > 0
          ? reduceWides >= wideExtraBallThreshold
          : !wideIsExtraBall;

      const isCountedExtra =
        (e.type === "ball" || e.type === "wicket") &&
        e.isExtra &&
        e.extraType !== "bye" &&
        e.extraType !== "legBye" &&
        !(isWide && wideCountsAsLegal);

      if (isCountedExtra) {
        totalExtras += Math.abs(e.runs || 0);
      } else if (e.countsAsBall) {
        if (legalSeen < legalBallsPerOver) {
          legalBalls.push(e);
          legalSeen++;
        }
      }

      if (isWide) reduceWides++;
    }

    while (legalBalls.length < legalBallsPerOver) legalBalls.push(null);

    if (totalExtras > 0) legalBalls.push({ extraCount: totalExtras });

    circles.splice(0, circles.length, ...legalBalls);
  }

  /* =====================================================
     FINAL FLAGS
  ===================================================== */

  const isFirstBall = actualLegalCount === 1 && overEvents.length === 1;

  const cappedBallsThisOver = Math.min(ballsForOverDisplay, legalBallsPerOver);

  return {
    circles,
    isFirstBall,
    ballsThisOver: cappedBallsThisOver,
  };
}
