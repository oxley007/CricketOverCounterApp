//import { BallEvent, WicketEvent, useMatchStore, matchStoreRef } from "../state/matchStore";
import { BallEvent, WicketEvent, matchStoreRef } from "../state/matchStore";

export type { BallEvent, WicketEvent };

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
    rules: { wideIsExtraBall: boolean }, // keep mandatory
    legalBallsPerOver = LEGAL_BALLS,
    maxCircles = MAX_CIRCLES
  ): { circles: CircleItem[]; isFirstBall: boolean } {
    //const { wideIsExtraBall } = useMatchStore.getState(); // ✅ only added this
    //const { wideIsExtraBall } = rules; // use passed rules, no default
    const { wideIsExtraBall } = matchStoreRef.getState();

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

    // STEP 2: decide which over to show, but keep last over displayed until new ball bowled
    // STEP 2: decide which over to display (stick last over until new legal ball bowled)
    let legalBallCounter = 0;
    let lastCompleteOverIndex = 0;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e) continue;

      const isWide = e.extraType === "wide";
      const countsAsLegal = e.countsAsBall || (isWide && !wideIsExtraBall);

      if (countsAsLegal) {
        legalBallCounter++;
        if (legalBallCounter % legalBallsPerOver === 0) {
          lastCompleteOverIndex = i + 1; // mark end of last full over
        }
      }
    }

    // Determine start index for display
    let overStartIndex: number;

    if (events.length > lastCompleteOverIndex) {
      // new legal ball bowled, start next over
      overStartIndex = lastCompleteOverIndex;
    } else {
      // stick last over (show last 6 balls)
      let tempCount = 0;
      for (let i = lastCompleteOverIndex - 1; i >= 0; i--) {
        const e = events[i];
        if (!e) continue;
        const isWide = e.extraType === "wide";
        const countsAsLegal = e.countsAsBall || (isWide && !wideIsExtraBall);
        if (countsAsLegal) tempCount++;
        if (tempCount === legalBallsPerOver) {
          overStartIndex = i;
          break;
        }
      }
      if (overStartIndex === undefined) overStartIndex = 0;
    }

    // Now slice events normally
    //const overEvents = events.slice(overStartIndex);

    // STEP 2: decide which over to show
    //const hasStartedNextOver = latestBoundaryIndex < events.length;
    //const overStartIndex = hasStartedNextOver ? latestBoundaryIndex : lastBoundaryIndex;

    /*
    // STEP 2: decide which over to show
    // Compute start index for the current over
    let overStartIndex = 0;
    let legalBallCounter = 0;

    // Find the last complete over
    for (let i = 0; i < events.length; i++) {
      if (events[i].countsAsBall) {
        legalBallCounter++;
        if (legalBallCounter % legalBallsPerOver === 0) {
          overStartIndex = i + 1; // start after last full over
        }
      }
    }
    */

    // STEP 3: slice current over events
    const overEvents = events.slice(overStartIndex);

    // STEP 4: build circles array
    const circles: CircleItem[] = [];
    let actualLegalCount = 0;
    let ballsForOverDisplay = 0; // 👈 NEW: count for 0.x over display

    overEvents.forEach((e) => {
      if (!e || "extraCount" in e) return; // skip nulls / extraCount

      const isWide = e.extraType === "wide";
      const isExtraDisplay =
        e.isExtra &&
        e.extraType !== "bye" &&
        e.extraType !== "legBye" &&
        !(isWide && !wideIsExtraBall);

      // Only count balls for over display if under 6
      const canCountBall = ballsForOverDisplay < legalBallsPerOver;
      //const countsForCircles = (e.countsAsBall || (isWide && !wideIsExtraBall)) && canCountBall;
      let countsForCircles = false;

      if (canCountBall) {
        if (isWide) {
          countsForCircles = !wideIsExtraBall;
        } else {
          countsForCircles = e.countsAsBall;
        }
      }

      if (countsForCircles) {
        circles.push(e);
        actualLegalCount++;
        ballsForOverDisplay++; // 👈 increment ball display
      } else if (isExtraDisplay) {
        // Extras like no-balls or byes still show, but do not increment ball count if over is full
        circles.push(e);
      }

      // Count extra wickets as legal balls only if under 6 balls
      const wicketCountsAsBall =
        e.type === "wicket" &&
        e.isExtra &&
        e.extraType !== "bye" &&
        e.extraType !== "legBye" &&
        !(e.extraType === "wide" && wideIsExtraBall);

      if (wicketCountsAsBall && ballsForOverDisplay < legalBallsPerOver) {
        actualLegalCount++;
        ballsForOverDisplay++;
      }
    });

    // STEP 5: padding, overflow, first-ball logic stays the same
    const extraOnlyEventsCount = overEvents.filter(
      (e) =>
        e &&
        e.isExtra &&
        !e.countsAsBall &&
        e.extraType !== "bye" &&
        e.extraType !== "legBye" &&
        !(e.extraType === "wide" && !wideIsExtraBall)
    ).length;

    const targetLength = Math.max(LEGAL_BALLS, actualLegalCount) + extraOnlyEventsCount;

    while (circles.length < targetLength) circles.push(null);

    if (circles.length > maxCircles) {
      let totalExtras = 0;
      const legalBalls: CircleItem[] = [];
      let legalSeen = 0;

      for (const e of circles) {
        if (!e || "extraCount" in e) continue;

        const isCountedExtra =
          (e.type === "ball" || e.type === "wicket") &&
          e.isExtra &&
          e.extraType !== "bye" &&
          e.extraType !== "legBye" &&
          !(e.extraType === "wide" && !wideIsExtraBall);

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

    const isFirstBall = actualLegalCount === 1 && overEvents.length === 1;

    // STEP 6: cap ballsThisOver at legalBallsPerOver
    const cappedBallsThisOver = Math.min(ballsForOverDisplay, legalBallsPerOver);

    return { circles, isFirstBall, ballsThisOver: cappedBallsThisOver };

  }
