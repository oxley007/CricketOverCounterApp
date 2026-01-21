// src/utils/currentOverUtils.testHelper.ts
import { BallEvent, WicketEvent, buildCurrentOverCircles as buildOriginal } from "./currentOverUtils";

/**
 * Helper to call the original buildCurrentOverCircles
 * without needing to provide rules (which normally come from store)
 * so your tests can pass without affecting the live app logic.
 */
export function buildCurrentOverCirclesForTest(
  events: (BallEvent | WicketEvent)[],
  legalBallsPerOver: number = 6,
  maxCircles: number = 10
) {
  // Provide default rules for testing
  const rules = { wideIsExtraBall: true };

  return buildOriginal(events, rules, legalBallsPerOver, maxCircles);
}
