import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useBallReminder } from "../../hooks/useBallReminder";
import { useMatchStore } from "../../state/matchStore";

export default function BallTimerDisplay() {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const proUnlockedScorebook = useMatchStore(
    (state) => state.proUnlockedScorebook,
  );

  const legalBalls = events.filter((e) => e.countsAsBall).length;
  const overs = legalBalls / 6;

  // This is your "enabled" logic
  const showTimer = overs <= 6 || proUnlocked || proUnlockedScorebook;

  // Pass 'showTimer' to the hook so the internal setInterval only runs when needed
  const {
    formattedTime,
    flashOn,
    timeSinceLastBall,
    paused,
    pauseReason,
    averageBallTime,
    avgBallPlusThreshold,
  } = useBallReminder(showTimer);

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
            (
            {pauseReason === "wicket"
              ? "PAUSED: Wicket"
              : "PAUSED: End of Over"}
            )
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
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 0,
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
