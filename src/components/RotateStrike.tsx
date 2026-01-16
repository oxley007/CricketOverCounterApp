import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function RotateStrike() {
  const events = useMatchStore((state) => state.events);
  const wicketsAsNegativeRuns = useMatchStore((state) => state.wicketsAsNegativeRuns);
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);

  const rotateStrikePercent = useMemo(() => {
    let rotateCount = 0;
    let eligibleBalls = 0;
    let legalBallCount = 0; // track balls in current over

    events.forEach((event) => {
      // Determine if this counts as a legal ball
      const countsAsBall =
        event.countsAsBall &&
        !(event.isExtra && (event.extraType === "wide" || event.extraType === "noBall") && !wideIsExtraBall);

      if (!countsAsBall || event.type !== "ball") return;

      legalBallCount++;

      // check if not the last ball of the over
      const isLastBallOfOver = legalBallCount % 6 === 0;

      if (!isLastBallOfOver) {
        eligibleBalls++;

        // Determine runs for this ball
        let runs = event.runs || 0;
        if (wicketsAsNegativeRuns && event.type === "wicket" && runs === 0) {
          runs = -wicketPenaltyRuns;
        }

        if (runs === 1 || runs === 3) {
          rotateCount++;
        }
      }
    });

    if (eligibleBalls === 0) return 0;

    return (rotateCount / eligibleBalls) * 100;
  }, [events, wicketsAsNegativeRuns, wicketPenaltyRuns, wideIsExtraBall]);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Rotate Strike %:</Text>
        <Text style={styles.textDesc}>{rotateStrikePercent.toFixed(1)}% (1's or 3's)</Text>
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
