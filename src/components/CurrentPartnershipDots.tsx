import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native"; // Swapped Card for View
import { Text } from "react-native-paper";
import { useMatchStore } from "../state/matchStore";

export default function CurrentPartnershipDots() {
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const { dotBalls, totalBalls, dotPercentage } = useMemo(() => {
    let dots = 0;
    let balls = 0;

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];

      if (event.type === "wicket") break;

      if (event.type === "ball" && event.countsAsBall) {
        balls++;

        let eventRuns = event.runs || 0;
        if (
          wicketsAsNegativeRuns &&
          event.type === "wicket" &&
          eventRuns === 0
        ) {
          eventRuns = -wicketPenaltyRuns;
        }

        if (eventRuns === 0) dots++;
      }
    }

    const percentage = balls > 0 ? (dots / balls) * 100 : 0;

    return { dotBalls: dots, totalBalls: balls, dotPercentage: percentage };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns]);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.textHeader}>
          Current Partnership Dots
        </Text>
        <Text variant="bodyLarge" style={styles.textDesc}>
          {dotBalls} dots | Dot %: {dotPercentage.toFixed(1)}%
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
    borderRadius: 12, // Matches standard Paper Card radius

    // Identical shadow configuration
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardContent: {
    padding: 16, // Matches standard Paper Card padding
    flex: 1, // Forces inner area to expand evenly
  },
  textHeader: {
    fontSize: 18,
    lineHeight: 20,
    marginBottom: 4,
    color: "#ffffff",
  },
  textDesc: {
    color: "#b2ebf2",
    marginTop: "auto", // Locks this metric row horizontally with the other card
  },
});
