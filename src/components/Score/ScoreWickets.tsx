import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import ScoreDelta from "./ScoreDelta";

export default function ScoreWickets() {
  const events = useMatchStore((state) => state.events);
  const baseRuns = useMatchStore((state) => state.baseRuns);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const [deltaQueue, setDeltaQueue] = useState<number[]>([]);

  // ---- Calculate total runs ----
  const eventRuns = events.reduce((sum, e) => {
    let runs = (e.runBreakdown?.bat ?? e.runs ?? 0)
             + (e.runBreakdown?.extras ?? 0);

    // If wickets count as negative runs
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

  const totalRuns = baseRuns + eventRuns;

  // ---- Count wickets for display ----
  // Exclude "retired" wickets from total
  const totalWickets = events.filter(
    (e) => e.type === "wicket" && e.kind !== "retired"
  ).length;

  // ---- Handle delta queue ----
  useEffect(() => {
    if (!events.length) return;

    const lastEvent = events[events.length - 1];

    let delta =
      (lastEvent.runBreakdown?.bat ?? lastEvent.runs ?? 0) +
      (lastEvent.runBreakdown?.extras ?? 0);

    // Only scoring negative runs for normal wickets (not retired)
    if (
        wicketsAsNegativeRuns &&
        lastEvent.type === "wicket" &&
        delta === 0 &&
        lastEvent.kind !== "retired" &&
        lastEvent.kind !== "partnership"
      ) {
        delta = -wicketPenaltyRuns;
      }

    if (delta !== 0) {
      setDeltaQueue((q) => [...q, delta]);
    }
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns]);

  const handleDeltaComplete = () => {
    setDeltaQueue((q) => q.slice(1));
  };

  return (
    <View>
      {/* Display total runs / wickets */}
      <Text style={styles.score}>{totalRuns}/{totalWickets}</Text>

      {/* Animate run deltas if any */}
      {deltaQueue.map((delta, idx) => (
        <ScoreDelta
          key={idx}
          delta={delta}
          onComplete={handleDeltaComplete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  score: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
});
