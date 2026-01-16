import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function CurrentPartnershipDots() {
  // Separate selectors to avoid infinite re-render
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const { dotBalls, totalBalls, dotPercentage } = useMemo(() => {
    let dots = 0;
    let balls = 0;

    // Iterate from last event backwards until a real wicket
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];

      // Only a real wicket ends the partnership
      if (event.type === "wicket") break;

      // Count legal deliveries
      if (event.type === "ball" && event.countsAsBall) {
        balls++;

        // Determine runs for dot calculation
        let eventRuns = event.runs || 0;
        if (wicketsAsNegativeRuns && event.type === "wicket" && eventRuns === 0) {
          eventRuns = -wicketPenaltyRuns;
        }

        if (eventRuns === 0) dots++;
      }
    }

    const percentage = balls > 0 ? (dots / balls) * 100 : 0;

    return { dotBalls: dots, totalBalls: balls, dotPercentage: percentage };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns]);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Current Partnership Dots:</Text>
        <Text style={styles.textDesc}>
          {dotBalls} dots | Dot %: {dotPercentage.toFixed(1)}%
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
