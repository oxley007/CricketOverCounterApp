import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useBallReminder } from "../../hooks/useBallReminder";
import { useMatchStore } from "../../state/matchStore";
import { useIsLiveViewer } from "../../hooks/useIsLiveViewer";

export default function BallTimerDisplay() {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const proUnlockedScorebook = useMatchStore(
    (state) => state.proUnlockedScorebook,
  );

  const isLiveViewer = useIsLiveViewer();

  const legalBalls = events.filter((e) => e.countsAsBall).length;
  const overs = legalBalls / 6;

  // This is your "enabled" logic
  //const showTimer = overs <= 6 || proUnlocked || proUnlockedScorebook;
  // Show the timer if it's pro/early overs OR if they are just a live viewer
  const showTimer =
    overs <= 6 || proUnlocked || proUnlockedScorebook || isLiveViewer;

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

  const hasExceeded = timeSinceLastBall > avgBallPlusThreshold;

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
    <View>
      <View style={styles.container}>
        <Text style={styles.leftText}>
          Time Since Last Ball:{" "}
          <Text
            style={[
              styles.timerText,
              // Add !isLiveViewer here to ensure flashing ONLY happens for scorers
              !isLiveViewer &&
                hasExceeded && {
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
      {/* New Flashing Alert Text */}
      {!isLiveViewer && hasExceeded && (
        <View
          style={[
            styles.alertContainer,
            { backgroundColor: flashOn ? "#FFEBEB" : "transparent" },
          ]}
        >
          <Text
            style={[
              styles.alertText,
              { color: flashOn ? "red" : "transparent" },
            ]}
          >
            FORGOTTEN TO SCORE A BALL?
          </Text>
        </View>
      )}
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
  alertContainer: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "red", // Keeps a subtle "warning" outline even when text blinks off
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    fontSize: 16, // 20 is quite large, 16 is punchy but fits most screens
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
