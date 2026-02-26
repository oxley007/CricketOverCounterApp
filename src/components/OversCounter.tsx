// OversCounter.tsx
import React from "react";
import { StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";

export default function OversCounter() {
  const events = useMatchStore((state) => state.events);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  /* =========================
     Get balls for current over
  ========================= */
  const { ballsThisOver } = buildCurrentOverCircles(events, {
    wideIsExtraBall,
  });

  // Total legal deliveries in match
  const wideExtraBallThreshold = useMatchStore(
    (state) => state.wideExtraBallThreshold,
  );

  let totalLegalBalls = 0;
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
      totalLegalBalls++;

      if (totalLegalBalls % 6 === 0) {
        widesThisOver = 0; // reset per over
      }
    }

    if (isWide) {
      widesThisOver++;
    }
  }

  // Completed overs
  const completedOvers = Math.floor(totalLegalBalls / 6);
  const ballsIntoOver = totalLegalBalls % 6;

  const displayOvers =
    ballsIntoOver === 0 && totalLegalBalls > 0
      ? `${completedOvers}.0`
      : `${completedOvers}.${ballsIntoOver}`;

  /* =========================
     Runs (includes negative wickets)
  ========================= */
  const totalRuns = events.reduce((sum, e) => {
    let runs = e.runs || 0;

    if (
      wicketsAsNegativeRuns &&
      e.type === "wicket" &&
      runs === 0 &&
      e.kind !== "retired" &&
      e.kind !== "partnership"
    ) {
      runs = -wicketPenaltyRuns;
    }

    return sum + runs;
  }, 0);

  /* =========================
     Run rate
  ========================= */
  const oversBowled = totalLegalBalls / 6;
  const runRate =
    oversBowled > 0 ? (totalRuns / oversBowled).toFixed(2) : "0.00";

  return (
    <Text style={styles.text}>
      Overs: {displayOvers}
      {"  "}
      <Text style={styles.subText}>RR: {runRate}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  subText: {
    fontSize: 16,
    opacity: 0.8,
  },
});
