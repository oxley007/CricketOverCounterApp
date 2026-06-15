import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Card, Text } from "react-native-paper"; // Imported Card and Text
import { useBallReminder } from "../../hooks/useBallReminder";
import { useMatchStore } from "../../state/matchStore";
import { useLiveStore } from "../../state/liveStore";
import { useIsLiveViewer } from "../../hooks/useIsLiveViewer";

type Props = {
  onUpgrade: () => void;
};

export default function BallTimerDisplay({ onUpgrade }: Props) {
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
        <Pressable style={styles.buttonUpgrade} onPress={onUpgrade}>
          <Text style={styles.buttonTextUpgrade}>Upgrade</Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card style={styles.card} mode="elevated">
      {/* Row 1: Split between Time Since Last Ball and Avg */}
      <View style={styles.row}>
        {/* Left Column Section */}
        <View style={styles.infoGroup}>
          <Text style={styles.labelCaps}>TIME SINCE LAST BALL: </Text>
          <Text
            style={[
              styles.timerText,
              !isLiveViewer &&
                hasExceeded && {
                  // Replaces the local red/cyan flash color with your theme token or flashing state
                  color: flashOn ? "#ffb4ab" : "#dae2fd",
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
        </View>

        {/* Right Column Section */}
        <View style={styles.infoGroup}>
          <Text style={styles.labelCaps}>AVG: </Text>
          <Text style={styles.avgText}>{Math.round(averageBallTime)} sec</Text>
        </View>
      </View>

      {/* Row 2: "Forgotten to score a ball?" Custom Alert Box */}
      {!isLiveViewer && hasExceeded && (
        <View
          style={[
            styles.alertContainer,
            {
              // Dynamic flashing control preserving the flashOn toggle structure
              borderColor: flashOn ? "#ddb7ff" : "transparent",
              backgroundColor: flashOn
                ? "rgba(221, 183, 255, 0.1)"
                : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.alertText,
              {
                color: flashOn ? "#ddb7ff" : "rgba(221, 183, 255, 0.4)",
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
    alignSelf: "stretch",
    // .glass-card token updates from design config
    backgroundColor: "rgba(45, 52, 73, 0.7)", // surface-container-highest with glass opacity
    padding: 16, // p-4 (16px)
    borderRadius: 12, // rounded-xl
    gap: 12, // space-y-3 (12px vertical spacing between rows)
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2 (8px spacing inside groups)
  },
  labelCaps: {
    // text-label-caps & font-label-caps configs
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96, // tracking-wide conversion for 0.08em
    color: "#bcc8cf", // text-on-surface-variant
    textTransform: "uppercase",
  },
  timerText: {
    // text-error & font-mono-stats configs
    fontFamily: "Geist",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500", // mono-stats weight
    color: "#ffb4ab", // text-error
  },
  avgText: {
    // text-on-surface & font-mono-stats configs
    fontFamily: "Geist",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#dae2fd", // text-on-surface
  },
  pausedText: {
    fontFamily: "Hanken Grotesk",
    fontSize: 11,
    color: "#bcc8cf",
  },
  alertContainer: {
    width: "100%",
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    borderWidth: 1, // border
    borderRadius: 8, // rounded-lg
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    // Matches text-secondary config typography rules
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600", // font-label-caps
    letterSpacing: 2, // tracking-widest
    textAlign: "center",
  },
  // Keep remaining clean modal/loading styling properties unchanged below
  modalContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: "88%",
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: "#555",
  },
  actionsColumn: {
    gap: 12,
  },
  primaryAction: {
    borderRadius: 8,
  },
  fullScorecardLink: {
    textDecorationLine: "underline",
    fontSize: 16,
    color: "#c471ed",
    textAlign: "center",
  },
  loadingContainer: {
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    marginBlock: 10,
  },
  buttonUpgrade: {
    backgroundColor: "#4f7cff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonTextUpgrade: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
