import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils"; // <- import here
import RunModal from "./RunModal/RunModal";

const { width } = Dimensions.get("window");

export default function ActionTabs() {
  const { addEvent, undoLastEvent } = useMatchStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [retireOnlyMode, setRetireOnlyMode] = useState(false);

  const selectedMode = useStartModalStore((state) => state.selectedMode);
  const isScorebook = selectedMode === "scorebook";

  // 1. Identify your brand (do this at the top of your component)
  const variant = Constants.expoConfig?.extra?.variant;
  const isLittleWicket = variant === "littlewicket";

  // 2. Define the dynamic color
  const undoColor = isLittleWicket ? "#e2339c" : "#c471ed";
  const dotColor = isLittleWicket ? "#e9df36" : "#FFF8F0";
  const dotColorIcon = isLittleWicket ? "#666" : "#12c2e9";
  const plusColor = isLittleWicket ? "#77dd77" : "#77dd77";

  /*
  const handleUndo = () => {
    const events = useMatchStore.getState().events;
    if (!events.length) return;

    const lastEvent = events[events.length - 1];

    if (lastEvent.type === "wicket") {
      Alert.alert("Undo Not Allowed", "You cannot undo after a wicket.");
      return;
    }

    undoLastEvent();
  };
  */

  const triggerTapFeedback = () => {
    Haptics.selectionAsync(); // very subtle
  };

  const handleUndo = () => {
    triggerTapFeedback();

    const events = useMatchStore.getState().events;
    if (!events.length) return;

    const lastEvent = events[events.length - 1];

    if (lastEvent.type === "wicket") {
      Alert.alert("Undo Not Allowed", "You cannot undo after a wicket.");
      return;
    }

    // 🔹 FIX: use over index instead of raw ball count
    // Previously you might have been doing: undoLastEvent();
    // Instead, pass the index of lastEvent relative to the over:
    const { ballsThisOver } = buildCurrentOverCircles(events, {
      wideIsExtraBall: useMatchStore.getState().wideIsExtraBall,
    });

    undoLastEvent(ballsThisOver - 1); // <- This ensures undo affects the correct ball in the over

    // 🔄 Reset the bowler if necessary
    useGameStore.getState().resetCurrentBowlerAfterUndo();
  };

  const tabs = [
    {
      key: "undo",
      color: undoColor,
      icon: <MaterialIcons name="undo" size={36} color="white" />,
      label: "Undo",
      onPress: handleUndo,
    },
    {
      key: "dot",
      color: dotColor,
      icon: <MaterialIcons name="lens" size={30} color={dotColorIcon} />,
      label: "Dot Ball",
      onPress: () => {
        triggerTapFeedback();
        const {
          currentGame,
          updateBatterStats,
          updateBowlerStats,
          applyStrikeChange,
        } = useGameStore.getState();

        const events = useMatchStore.getState().events;
        const wideIsExtraBall = useMatchStore.getState().wideIsExtraBall;

        // Actual balls bowled this over from events
        const { ballsThisOver: actualBallsThisOver } = buildCurrentOverCircles(
          events,
          { wideIsExtraBall },
        );

        const lastBowlerId = currentGame?.lastBowlerId;
        const currentBowlerId = currentGame?.currentBowlerId;

        // 🔹 LOG for debugging
        console.log("=== DOT BALL LOG ===");
        console.log(
          "ActionTabs ballsThisOver:",
          currentGame?.ballsBowledThisOver ?? 0,
        );
        console.log("Actual ballsThisOver from events:", actualBallsThisOver);
        console.log("currentBowlerId:", currentBowlerId);
        console.log("lastBowlerId:", lastBowlerId);
        console.log("===================");

        // 1. ADD THIS GUARD FIRST
        // 🛑 Guard – check if in Scorebook mode and battingTeamId is missing
        if (
          !isScorebook &&
          !useGameStore.getState().currentGame?.battingTeamId
        ) {
          Alert.alert(
            "Teams Required",
            "Please select the batting team before you start scoring.",
          );
          return;
        }

        // 🛑 Guard – must have bowler
        if (isScorebook && !currentBowlerId) {
          Alert.alert("Please select a bowler to continue");
          return;
        }

        // 🛑 Guard – must have striker
        const activeStriker = currentGame?.activeBatters?.find(
          (b) => b.playerId === currentGame.currentStrikeId,
        );

        if (isScorebook && !activeStriker) {
          Alert.alert("Please select the facing batter to continue");
          return;
        }

        // 🛑 Guard – only block if over complete
        console.log("🕵️ ActionTabs: Over guard check", {
          actualBallsThisOver,
          currentBowlerId,
          lastBowlerId,
        });
        if (
          isScorebook &&
          actualBallsThisOver >= 6 &&
          currentBowlerId === lastBowlerId
        ) {
          Alert.alert("Please add the next bowler to continue");
          return;
        }

        const countsAsBall = true;
        const bat = 0;
        const extras = 0;

        // 1️⃣ Add scorebook event
        addEvent({
          type: "ball",
          batterId: currentGame.currentStrikeId,
          batterInningId: activeStriker?.batterInningId || "",
          bowlerId: currentBowlerId,
          runs: 0,
          isExtra: false,
          countsAsBall,
          runBreakdown: { bat, extras },
          prevBatterId: currentGame?.currentStrikeId,
        });

        // 2️⃣ Update batter stats
        updateBatterStats(
          currentGame.currentStrikeId,
          bat,
          countsAsBall ? 1 : 0,
        );

        // 3️⃣ Update bowler stats
        /*
        updateBowlerStats(
          currentBowlerId,
          { overs: 1, maidens: 0, runs: 0, wickets: 0, extras: 0 },
          countsAsBall,
        );
        */

        // 3️⃣ Update bowler stats with correct ball index

        const overBallIndex = actualBallsThisOver % 6;

        updateBowlerStats(
          currentBowlerId,
          { overs: 1, maidens: 0, runs: 0, wickets: 0, extras: 0 },
          countsAsBall,
          overBallIndex, // ✅ use ball index instead of placeholder
        );

        // 4️⃣ Apply strike change
        applyStrikeChange({ bat, extras, countsAsBall });
      },
    },
    {
      key: "plus",
      color: plusColor,
      icon: <MaterialIcons name="add" size={36} color="white" />,
      label: "Scoring",
      onPress: () => {
        const { currentGame } = useGameStore.getState();
        const events = useMatchStore.getState().events;
        const wideIsExtraBall = useMatchStore.getState().wideIsExtraBall;

        // Actual balls bowled this over from events
        const { ballsThisOver: actualBallsThisOver } = buildCurrentOverCircles(
          events,
          { wideIsExtraBall },
        );

        const currentBowlerId = currentGame?.currentBowlerId;
        const lastBowlerId = currentGame?.lastBowlerId;
        const ballsThisOverFromGame = currentGame?.ballsBowledThisOver ?? 0;

        // 🔹 LOG for debugging
        console.log("=== BALLS LOG ===");
        console.log("ActionTabs ballsThisOver:", ballsThisOverFromGame);
        console.log("Actual ballsThisOver from events:", actualBallsThisOver);
        console.log("currentBowlerId:", currentBowlerId);
        console.log("lastBowlerId:", lastBowlerId);
        console.log("=================");

        if (
          !isScorebook &&
          !useGameStore.getState().currentGame?.battingTeamId
        ) {
          Alert.alert(
            "Teams Required",
            "Please select the batting team before you start scoring.",
          );
          return;
        }

        // Guard – must have a bowler
        if (isScorebook && !currentBowlerId) {
          Alert.alert("Please add a bowler to continue");
          return;
        }

        // 🛑 Guard – must have striker
        const activeStriker = currentGame?.activeBatters?.find(
          (b) => b.playerId === currentGame?.currentStrikeId,
        );

        if (isScorebook && !activeStriker) {
          Alert.alert("Please select the facing batter to continue");
          return;
        }

        // Guard – only block if over complete
        // ✅ Use actual balls from events instead of tracked ballsThisOver
        if (
          isScorebook &&
          actualBallsThisOver >= 6 &&
          currentBowlerId === lastBowlerId
        ) {
          Alert.alert(
            "Over Complete",
            wicketsAsNegativeRuns
              ? "This over is complete.\n\nAdd the next bowler to continue scoring.\nIf you need to end the current partnership, you can continue."
              : "This over is complete.\n\nAdd the next bowler to continue scoring.\nIf you need to retire a batter, you can continue.",
            [
              {
                text: "Back to add a Bowler",
                style: "cancel",
              },
              {
                text: wicketsAsNegativeRuns
                  ? "Continue to End Partnership"
                  : "Continue to Retire Batter",
                onPress: () => {
                  setRetireOnlyMode(true);
                  setModalVisible(true);
                },
              },
            ],
          );

          return;
        }

        setModalVisible(true);
      },
    },
  ];

  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );

  return (
    <>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={tab.onPress}
            style={[styles.tab, { backgroundColor: tab.color }]}
          >
            <View style={styles.iconWrapper}>{tab.icon}</View>
            <Text
              style={[
                styles.label,
                tab.key === "dot"
                  ? { color: isLittleWicket ? "#666" : "#12c2e9" } // Dot color
                  : { color: isLittleWicket ? "#fff" : "#fff" }, // Default color
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <RunModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setRetireOnlyMode(false); // reset when closed
        }}
        retireOnlyMode={retireOnlyMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: width,
    height: 120,
    position: "absolute",
    bottom: 0,
    left: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
  },
  label: { fontSize: 16, fontWeight: "600", marginTop: 4 },
});
