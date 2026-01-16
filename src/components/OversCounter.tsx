// OversCounter.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function OversCounter() {
  // Separate selectors to avoid infinite re-render
  const events = useMatchStore((state) => state.events);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  /* =========================
     Legal deliveries
  ========================= */
  const legalBalls = events.reduce(
    (count, e) => count + (e.countsAsBall ? 1 : 0),
    0
  );

  const overs = Math.floor(legalBalls / 6);
  const ballsInOver = legalBalls % 6;

  /* =========================
     Runs (includes negative wickets)
  ========================= */
  const totalRuns = events.reduce((sum, e) => {
    let runs = e.runs || 0;

    // Apply negative runs for wickets if enabled
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
  const oversBowled = legalBalls / 6;
  const runRate = oversBowled > 0 ? (totalRuns / oversBowled).toFixed(2) : "0.00";

  return (
    <Text style={styles.text}>
      Overs: {overs}.{ballsInOver}{"  "}
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
