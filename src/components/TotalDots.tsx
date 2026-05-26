import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native"; // Swapped out container components
import { Text } from "react-native-paper"; // Using Paper typography variants
import { useMatchStore } from "../state/matchStore";

export default function TotalDots() {
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);

  const { totalDots, totalBalls, dotPercentage } = useMemo(() => {
    let dots = 0;
    let balls = 0;

    events.forEach((event) => {
      const countsAsBall =
        event.countsAsBall &&
        !(
          event.isExtra &&
          (event.extraType === "wide" || event.extraType === "noBall") &&
          !wideIsExtraBall
        );

      if (countsAsBall) {
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
    });

    const percentage = balls > 0 ? (dots / balls) * 100 : 0;

    return { totalDots: dots, totalBalls: balls, dotPercentage: percentage };
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns, wideIsExtraBall]);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.textHeader}>
          Total Innings Dots
        </Text>
        <Text variant="bodyLarge" style={styles.textDesc}>
          {totalDots} dots | Dot %: {dotPercentage.toFixed(1)}%
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

    // Identical shadow configuration
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardContent: {
    padding: 16,
    flex: 1, // Expands the interior context uniformly
  },
  textHeader: {
    fontSize: 18,
    lineHeight: 20, // Tight layout spacing
    marginBottom: 4,
    color: "#ffffff", // Crisp white primary labels
  },
  textDesc: {
    color: "#b2ebf2", // Rich secondary teal accent tint
    marginTop: "auto", // Locks this metric row horizontally when grid-aligned
  },
});
