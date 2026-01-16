import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function HighestPartnership() {
  // Separate selectors to avoid infinite re-render
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const highestPartnership = useMemo(() => {
    const partnerships: number[] = [];
    let currentRuns = 0;
    let partnershipEnded = false; // 👈 same guard

    events.forEach((event) => {
      const eventRuns = event.runs ?? 0;
      currentRuns += eventRuns;

      if (event.type === "wicket") {
        if (wicketsAsNegativeRuns) {
          // ONLY explicit partnership wickets end partnership
          if (event.kind === "partnership") {
            if (!partnershipEnded) {
              if (currentRuns !== 0) partnerships.push(currentRuns);
              currentRuns = 0;
              partnershipEnded = true;
            }
          }
        } else {
          // Normal cricket mode
          if (event.kind !== "retired") {
            if (currentRuns !== 0) partnerships.push(currentRuns);
            currentRuns = 0;
          }
        }
      } else {
        // Any scoring event resets the guard
        partnershipEnded = false;
      }
    });

    // Ongoing partnership
    if (currentRuns !== 0) partnerships.push(currentRuns);

    console.log("🏏 Highest partnership array:", partnerships);

    if (partnerships.length === 0) return 0;

    return Math.max(...partnerships);
  }, [events, wicketsAsNegativeRuns]);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Highest Partnership:</Text>
        <Text style={styles.textDesc}>{highestPartnership} runs</Text>
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
