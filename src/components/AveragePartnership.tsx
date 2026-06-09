import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native"; // Swapped out container components
import { Text } from "react-native-paper"; // Using Paper typography variants
import { useMatchStore } from "../state/matchStore";

export default function AveragePartnership() {
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );

  const averagePartnership = useMemo(() => {
    const partnerships: number[] = [];
    let currentRuns = 0;
    let partnershipEnded = false;

    events.forEach((event) => {
      const eventRuns = event.runs ?? 0;
      currentRuns += eventRuns;

      if (event.type === "wicket") {
        if (wicketsAsNegativeRuns) {
          if (event.kind === "partnership") {
            if (!partnershipEnded) {
              if (currentRuns !== 0) partnerships.push(currentRuns);
              currentRuns = 0;
              partnershipEnded = true;
            }
          }
        } else {
          if (event.kind !== "retired") {
            if (currentRuns !== 0) partnerships.push(currentRuns);
            currentRuns = 0;
          }
        }
      } else {
        partnershipEnded = false;
      }
    });

    if (currentRuns !== 0) partnerships.push(currentRuns);

    console.log("📊 Partnership runs array new:", partnerships);

    if (partnerships.length === 0) return 0;

    return (
      partnerships.reduce((sum, val) => sum + val, 0) / partnerships.length
    );
  }, [events, wicketsAsNegativeRuns]);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.textHeader}>
          Average Partnership
        </Text>
        <Text variant="bodyLarge" style={styles.textDesc}>
          {averagePartnership.toFixed(2)} runs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginVertical: 0,
    backgroundColor: "#0e9cb9", // Matches dark cyan theme
    borderRadius: 12,

    // Identical shadow tracking configuration
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardContent: {
    padding: 16,
    flex: 1, // Forces inner area to expand evenly if used in horizontal grids
  },
  textHeader: {
    fontSize: 18,
    lineHeight: 20, // Tight layout spacing
    marginBottom: 4,
    color: "#ffffff", // Crisp white primary labels
  },
  textDesc: {
    color: "#b2ebf2", // Rich secondary teal accent tint
    marginTop: "auto", // Locks this metric row horizontally if aligned next to another card
  },
});
