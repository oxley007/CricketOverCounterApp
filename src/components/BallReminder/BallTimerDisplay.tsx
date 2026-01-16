import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useBallReminder } from "../../hooks/useBallReminder";
import { useMatchStore } from "../../state/matchStore";

export default function BallTimerDisplay() {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);

  // Compute completed overs (only legal balls)
  const overs = events.filter((e) => e.countsAsBall).length / 6;

  // Show timer if <= 6 overs or Pro unlocked
  const showTimer = overs <= 6 || proUnlocked;

  const {
    formattedTime,
    thresholdSeconds,
    averageBallTime,
    flashOn,
    timeSinceLastBall,
    paused,
    pauseReason,
    deliveryIntervals,
    avgBallPlusThreshold,
  } = useBallReminder();

  if (!showTimer) {
    return (
      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeText}>
          Unlock Pro to continue seeing Ball Timer after 6 overs
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.leftText}>
        Time Since Last Ball:{" "}
        <Text
          style={[
            styles.timerText,
            timeSinceLastBall > avgBallPlusThreshold && {
              color: flashOn ? "red" : "#555",
            },
          ]}
        >
          {formattedTime}
        </Text>
        {paused && (
          <Text style={styles.pausedText}>
            {" "}
            ({pauseReason === "wicket"
              ? "PAUSED: Wicket"
              : "PAUSED: End of Over"})
          </Text>
        )}
      </Text>

      <Text style={styles.thresholdText}>
        Avg: {Math.round(averageBallTime)} sec
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginVertical: 6,
  },
  timerText: {
    fontSize: 12,
    color: "#555",
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },
  leftText: {
    fontSize: 12,
    color: "#000",
    flexShrink: 1,
  },
  pausedText: {
    fontSize: 11,
    color: "#777",
  },
  upgradeContainer: {
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    marginVertical: 6,
  },
  upgradeText: {
    color: "#856404",
    fontSize: 12,
    textAlign: "center",
  },
});
