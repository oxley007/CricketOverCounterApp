import { MaterialIcons } from "@expo/vector-icons";
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
import RunModal from "./RunModal/RunModal";

const { width } = Dimensions.get("window");

export default function ActionTabs() {
  const { addEvent, undoLastEvent } = useMatchStore();
  const [modalVisible, setModalVisible] = useState(false);

  const tabs = [
    {
      key: "undo",
      color: "#c471ed",
      icon: <MaterialIcons name="undo" size={36} color="white" />,
      label: "Undo",
      onPress: undoLastEvent,
    },
    {
      key: "dot",
      color: "#FFF8F0",
      icon: <MaterialIcons name="lens" size={30} color="#12c2e9" />,
      label: "Dot Ball",
      onPress: () => {
        const {
          currentGame,
          updateBatterStats,
          updateBowlerStats,
          applyStrikeChange,
        } = useGameStore.getState();

        const lastBowlerId = currentGame?.lastBowlerId;

        console.log(lastBowlerId, " what i lastBowlerId");

        // 🛑 Log for debugging
        console.log(
          "ActionTabs – currentBowlerId:",
          currentGame?.currentBowlerId,
          "lastBowlerId:",
          lastBowlerId,
        );

        // 🛑 Guard – must have bowler
        const currentBowlerId = currentGame?.currentBowlerId;

        // 🛑 Guard – must have a valid new bowler
        if (!currentBowlerId) {
          Alert.alert("Please add a bowler to continue");
          return;
        } else if (currentBowlerId === lastBowlerId) {
          Alert.alert("Please add the next bowler to continue");
          return;
        }

        // 🛑 Guard – nothing to score yet
        if (!currentGame?.currentStrikeId) {
          console.warn("No current striker set");
          return;
        }

        const countsAsBall = true;
        const bat = 0;
        const extras = 0;

        // 1️⃣ Add scorebook event
        addEvent({
          type: "ball",
          batterId: currentGame.currentStrikeId,
          bowlerId: currentGame.currentBowlerId,
          runs: 0,
          isExtra: false,
          countsAsBall,
          runBreakdown: { bat, extras },
        });

        // 2️⃣ Update batter stats
        updateBatterStats(
          currentGame.currentStrikeId,
          bat,
          countsAsBall ? 1 : 0,
        );

        // 3️⃣ Update bowler stats
        updateBowlerStats(
          currentGame.currentBowlerId,
          {
            overs: 1,
            maidens: 0,
            runs: 0,
            wickets: 0,
            extras: 0,
          },
          countsAsBall,
        );

        // 4️⃣ Apply strike change
        applyStrikeChange({ bat, extras, countsAsBall });
      },
    },
    {
      key: "plus",
      color: "#77dd77",
      icon: <MaterialIcons name="add" size={36} color="white" />,
      label: "Scoring",
      onPress: () => {
        const { currentGame } = useGameStore.getState();

        const currentBowlerId = currentGame?.currentBowlerId;
        const lastBowlerId = currentGame?.lastBowlerId;

        // 🛑 Guard – must have a bowler selected
        if (!currentBowlerId) {
          Alert.alert("Please add a bowler to continue");
          return;
        }

        // 🛑 Guard – must be a new bowler
        if (currentBowlerId === lastBowlerId) {
          Alert.alert("Please add the next bowler to continue");
          return;
        }

        setModalVisible(true);
      },
    },
  ];

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
                tab.key === "dot" ? { color: "#12c2e9" } : { color: "#fff" },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <RunModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
