import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function TotalDots() {
  // Separate selectors
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);

  const { totalDots, totalBalls, dotPercentage } = useMemo(() => {
    let dots = 0;
    let balls = 0;

    events.forEach((event) => {
      // Determine if this counts as a legal ball
      const countsAsBall =
        event.countsAsBall &&
        !(event.isExtra && (event.extraType === "wide" || event.extraType === "noBall") && !wideIsExtraBall);

      if (countsAsBall) {
        balls++;

        // Determine runs for dot calculation
        let eventRuns = event.runs || 0;
        if (wicketsAsNegativeRuns && event.type === "wicket" && eventRuns === 0) {
          eventRuns = -wicketPenaltyRuns;
        }

        if (eventRuns === 0) dots++;
      }
    });

    const percentage = balls > 0 ? (dots / balls) * 100 : 0;

    return { totalDots: dots, totalBalls: balls, dotPercentage: percentage };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns, wideIsExtraBall]);

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Total Innings Dots:</Text>
        <Text style={styles.textDesc}>
          {totalDots} dots | Dot %: {dotPercentage.toFixed(1)}%
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
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
