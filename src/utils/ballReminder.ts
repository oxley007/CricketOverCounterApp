import { MatchEvent } from "../state/matchStore";

export function getAverageSecondsPerBall(events: MatchEvent[]) {
  const legalBalls = events.filter(e => e.countsAsBall);

  if (legalBalls.length < 2) return null;

  let totalDiff = 0;

  for (let i = 1; i < legalBalls.length; i++) {
    totalDiff +=
      legalBalls[i].timestamp - legalBalls[i - 1].timestamp;
  }

  return totalDiff / (legalBalls.length - 1) / 1000; // seconds
}

export function getReminderDelayMs(
  avgSeconds: number,
  thresholdPercent: number
) {
  return avgSeconds * (1 + thresholdPercent / 100) * 1000;
}
