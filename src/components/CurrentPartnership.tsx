import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native"; // Swapped Card for View
import { Text } from "react-native-paper";
import { useMatchStore } from "../state/matchStore";

export default function CurrentPartnership() {
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const { partnershipRuns, partnershipBalls } = useMemo(() => {
    let runs = 0;
    let balls = 0;

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];

      if (event.type === "wicket") break;
      if (event.type === "ball" && event.countsAsBall) balls++;

      let eventRuns = event.runs || 0;
      if (wicketsAsNegativeRuns && event.type === "wicket" && eventRuns === 0) {
        eventRuns = -wicketPenaltyRuns;
      }
      runs += eventRuns;
    }

    return { partnershipRuns: runs, partnershipBalls: balls };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns]);

  const runRate =
    partnershipBalls > 0 ? (partnershipRuns / partnershipBalls) * 6 : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.textHeader}>
          Current Partnership
        </Text>
        <Text variant="bodyLarge" style={styles.textDesc}>
          {partnershipRuns} runs | Run rate: {runRate.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginVertical: 0,
    backgroundColor: "#0e9cb9",
    borderRadius: 12, // Standard Paper Card radius

    // Cross-platform elevation shadow that scales perfectly with flex: 1
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardContent: {
    padding: 16, // Matches standard Paper Card.Content padding
    flex: 1, // Makes inner layout expand to full height safely
  },
  textHeader: {
    fontSize: 18,
    lineHeight: 20,
    marginBottom: 4,
    color: "#ffffff",
  },
  textDesc: {
    color: "#b2ebf2",
    marginTop: "auto", // Keeps bottom metrics aligned perfectly
  },
});
