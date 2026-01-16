import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function CurrentPartnership() {
  // Separate selectors from Zustand store
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  // Calculate current partnership runs and balls
  const { partnershipRuns, partnershipBalls } = useMemo(() => {
    let runs = 0;
    let balls = 0;

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];

      // Real wicket ends partnership
      if (event.type === "wicket") break;

      // Count legal deliveries
      if (event.type === "ball" && event.countsAsBall) balls++;

      // Add runs (apply negative runs for wickets if enabled)
      let eventRuns = event.runs || 0;
      if (wicketsAsNegativeRuns && event.type === "wicket" && eventRuns === 0) {
        eventRuns = -wicketPenaltyRuns;
      }
      runs += eventRuns;
    }

    return { partnershipRuns: runs, partnershipBalls: balls };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns]);

  // Calculate run rate: runs per over (6 balls)
  const runRate =
    partnershipBalls > 0 ? (partnershipRuns / partnershipBalls) * 6 : 0;

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Current Partnership:</Text>
        <Text style={styles.textDesc}>
          {partnershipRuns} runs | Run rate: {runRate.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    marginVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  textHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  textDesc: {
    fontSize: 16,
    color: "#c471ed",
  },
});
