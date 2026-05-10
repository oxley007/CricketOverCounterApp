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

  // 1. Identify your brand (do this at the top of your component)
  const { theme } = useTenantConfig();

  const actionTabs = theme.actionTabs;

  const undoColor = actionTabs.undoColor;
  const dotColor = actionTabs.dotColor;
  const dotColorIcon = actionTabs.dotIconColor;
  const plusColor = actionTabs.plusColor;

  const undoAction = useUndoAction();
  const dotBallAction = useDotBallAction(isScorebook);
  const plusAction = usePlusAction({
    isScorebook,
    setModalVisible,
    setRetireOnlyMode,
  });

  const tabs = [
    {
      key: "undo",
      color: undoColor,
      icon: <MaterialIcons name="undo" size={36} color="white" />,
      label: "Undo",
      onPress: undoAction,
    },
    {
      key: "dot",
      color: dotColor,
      icon: <MaterialIcons name="lens" size={30} color={dotColorIcon} />,
      label: "Dot Ball",
      onPress: dotBallAction,
    },
    {
      key: "plus",
      color: plusColor,
      icon: <MaterialIcons name="add" size={36} color="white" />,
      label: "Scoring",
      onPress: plusAction,
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
                {
                  color:
                    tab.key === "dot"
                      ? actionTabs.dotLabelColor
                      : actionTabs.labelColor,
                },
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
