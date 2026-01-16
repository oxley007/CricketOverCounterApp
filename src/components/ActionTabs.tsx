import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useMatchStore } from "../state/matchStore";
import { MaterialIcons } from "@expo/vector-icons";
import RunModal from "./RunModal/RunModal";

const { width } = Dimensions.get("window");

export default function ActionTabs() {
  const { addEvent, undoLastEvent } = useMatchStore();
  const [modalVisible, setModalVisible] = useState(false);

  const tabs = [
    { key: "undo", color: "#c471ed", icon: <MaterialIcons name="undo" size={36} color="white" />, label: "Undo", onPress: undoLastEvent },
    { key: "dot", color: "#FFF8F0", icon: <MaterialIcons name="lens" size={30} color="#12c2e9" />, label: "Dot Ball", onPress: () =>
  addEvent({
    type: "ball",
    runs: 0,
    isExtra: false,
    countsAsBall: true,
  })
 },
    { key: "plus", color: "#77dd77", icon: <MaterialIcons name="add" size={36} color="white" />, label: "Scoring", onPress: () => setModalVisible(true) },
  ];

  return (
    <>
      <View style={styles.container}>
        {tabs.map((tab) => (
          <Pressable key={tab.key} onPress={tab.onPress} style={[styles.tab, { backgroundColor: tab.color }]}>
            <View style={styles.iconWrapper}>{tab.icon}</View>
            <Text style={[styles.label, tab.key === "dot" ? { color: "#12c2e9" } : { color: "#fff" }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <RunModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", width: width, height: 120, position: "absolute", bottom: 0, left: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  tab: { flex: 1, justifyContent: "flex-end", alignItems: "center", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 40 },
  iconWrapper: { justifyContent: "center", alignItems: "center", width: 36, height: 36 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 4 },
});
