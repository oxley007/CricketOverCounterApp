import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useStartModalStore } from "../state/startModalStore";
import RunModal from "./RunModal/RunModal";
import { useUndoAction } from "../hooks/useUndoAction";
import { useDotBallAction } from "../hooks/useDotBallAction";
import { usePlusAction } from "../hooks/usePlusAction";
import { useTenantConfig } from "../hooks/useTenantConfig";

const { width } = Dimensions.get("window");

export default function ActionTabs() {
  const [modalVisible, setModalVisible] = useState(false);
  const [retireOnlyMode, setRetireOnlyMode] = useState(false);

  const selectedMode = useStartModalStore((state) => state.selectedMode);
  const isScorebook = selectedMode === "scorebook";

  // Brand config properties pulled from hook configuration
  const { theme } = useTenantConfig();
  const actionTabs = theme.actionTabs;

  // Action hook mappings
  const undoAction = useUndoAction();
  const dotBallAction = useDotBallAction(isScorebook);
  const plusAction = usePlusAction({
    isScorebook,
    setModalVisible,
    setRetireOnlyMode,
  });

  return (
    <>
      {/* Target Nav Controller Base */}
      <View style={styles.navBar}>
        <View style={styles.tabsRow}>
          {/* 1. Left Action Tab: Undo Button */}
          <Pressable
            onPress={undoAction}
            style={({ pressed }) => [
              styles.tabSide,
              {
                backgroundColor: pressed
                  ? "rgba(221, 183, 255, 0.08)"
                  : "transparent",
              },
            ]}
          >
            <View
              style={[styles.circleIconWrapper, { backgroundColor: "#6f00be" }]}
            >
              {/* Swapped to use your large layout undo arrow icon */}
              <MaterialIcons name="undo" size={24} color="#ddb7ff" />
            </View>
            <Text style={[styles.labelCaps, { color: "#ddb7ff" }]}>UNDO</Text>
          </Pressable>

          {/* 2. Floating Center Tab: Dot Ball Button */}
          <Pressable onPress={dotBallAction} style={styles.tabCenter}>
            {/* Elevated floating outer ring element */}
            <View
              style={[
                styles.floatingBall,
                { backgroundColor: actionTabs.dotColor || "#00c2f3" },
              ]}
            >
              {/* Dynamic blinking inner core tracker component */}
              <View
                style={[
                  styles.pulseCore,
                  { backgroundColor: actionTabs.dotIconColor || "#fff" },
                ]}
              />
            </View>
            <Text
              style={[
                styles.labelCaps,
                styles.labelCenterSpacing,
                { color: "#7fdaff" },
              ]}
            >
              DOT BALL
            </Text>
          </Pressable>

          {/* 3. Right Action Tab: Scoring Options Plus Trigger */}
          <Pressable
            onPress={plusAction}
            style={({ pressed }) => [
              styles.tabSide,
              {
                backgroundColor: pressed
                  ? "rgba(248, 202, 17, 0.08)"
                  : "transparent",
              },
            ]}
          >
            <View
              style={[styles.circleIconWrapper, { backgroundColor: "#d7af00" }]}
            >
              <MaterialIcons name="add" size={24} color="#554300" />
            </View>
            <Text style={[styles.labelCaps, { color: "#f8ca11" }]}>
              SCORING
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Persistent Backdrop Modals Mount Sheet */}
      <RunModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setRetireOnlyMode(false);
        }}
        retireOnlyMode={retireOnlyMode}
      />
    </>
  );
}

// Extracted style sheets matching your HTML configuration
const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: 96, // h-24 -> 24 * 4px = 96px
    backgroundColor: "rgba(11, 19, 38, 0.85)", // bg-surface/80
    borderTopWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30

    // Performance friendly iOS and Android backdrop shadow offsets
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: "row",
    height: "100%",
    width: "100%",
  },
  tabSide: {
    flex: 1, // flex-1
    alignItems: "center",
    justifyContent: "center",
    gap: 4, // gap-1
  },
  tabCenter: {
    flex: 1.5, // flex-[1.5]
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circleIconWrapper: {
    width: 44, // w-12 equivalent sizing bounds
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBall: {
    position: "absolute",
    top: -44, // Pulls the ball floating halfway above the boundary track line
    width: 100, // w-20 scaling configuration
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#0b1326", // border-background (#0b1326)
    alignItems: "center",
    justifyContent: "center",

    // Unique pop box shadow style tracking rule matching web configuration specs
    shadowColor: "#00c2f3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  pulseCore: {
    width: 16, // w-4 core size target boundary
    height: 16,
    borderRadius: 8,
  },
  labelCaps: {
    fontFamily: "Geist",
    fontSize: 12, // text-label-caps / font-label-caps rules
    letterSpacing: 0.96,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  labelCenterSpacing: {
    marginTop: 52, // Pushes text block cleanly below the floating bubble diameter path
    fontWeight: "800", // font-bold
  },
});
