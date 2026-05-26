import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper"; // Imported Card and Text
import { useBallReminder } from "../../hooks/useBallReminder";
import { useMatchStore } from "../../state/matchStore";
import { useLiveStore } from "../../state/liveStore";
import { useIsLiveViewer } from "../../hooks/useIsLiveViewer";

export default function BallTimerDisplay() {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const proUnlockedScorebook = useMatchStore(
    (state) => state.proUnlockedScorebook,
  );

  const livePro = useLiveStore((s) => s.livePro);
  const liveProViewer = useLiveStore((state) => state.liveProViewer);

  const isProLiveUnlocked = liveProViewer || livePro;
  const isLiveViewer = useIsLiveViewer();

  const legalBalls = events.filter((e) => e.countsAsBall).length;
  const overs = legalBalls / 6;

  const showTimer =
    overs <= 6 ||
    proUnlocked ||
    proUnlockedScorebook ||
    isProLiveUnlocked ||
    isLiveViewer;

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

  // The upgrade banner styled as a soft notice card
  if (!showTimer) {
    return (
      <Card style={styles.upgradeCard} mode="elevated">
        <Text style={styles.upgradeText}>
          Unlock Pro to continue seeing Ball Timer after 6 overs
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card} mode="elevated">
      <View style={styles.container}>
        <Text style={styles.leftText}>
          Time Since Last Ball:{" "}
          <Text
            style={[
              styles.timerText,
              !isLiveViewer &&
                hasExceeded && {
                  color: flashOn ? "#ff4d4d" : "#e0f7fa", // High visibility red vs light cyan
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
            {
              // 15% opacity tint of Amber Yellow when flashing
              backgroundColor: flashOn
                ? "rgba(255, 213, 79, 0.15)"
                : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.alertText,
              {
                // Sharp amber text color when flashing
                color: flashOn ? "#ffd54f" : "transparent",
              },
            ]}
          >
            FORGOTTEN TO SCORE A BALL?
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 0,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Matching dark cyan theme
    padding: 12,
    height: "auto",
    alignSelf: "stretch",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent", // Transparent to let card backdrop show
  },
  timerText: {
    fontSize: 12,
    color: "#e0f7fa", // Soft cyan text for layout harmony
    fontWeight: "bold",
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff", // Crisp white text
  },
  leftText: {
    fontSize: 12,
    color: "#ffffff", // Crisp white text
    flexShrink: 1,
  },
  pausedText: {
    fontSize: 11,
    color: "#b2ebf2", // Darker text tint for subtext elements
  },
  upgradeCard: {
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#fff3cd", // Keeps warning yellow skin
    padding: 12,
    alignSelf: "stretch",
  },
  upgradeText: {
    color: "#856404",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  alertContainer: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    // Amber border line instead of harsh red
    borderColor: "#ffd54f",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
