import React from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import WicketsNegativeInfo from "./WicketsNegativeInfo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchRulesModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // ✅ Hook is inside the component
  const wicketsAsNegativeRuns = useMatchStore(
    (s) => s.wicketsAsNegativeRuns
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Match Rules</Text>
          <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
            >
            {/* ✅ Show info when setting is enabled */}
            {wicketsAsNegativeRuns && (
              <WicketsNegativeInfo />
            )}

            {/* 👇 CONTENT COMES FROM PARENT */}
            <View style={styles.content}>
              {children}
            </View>
          </ScrollView>
          <Pressable
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              Save & Continue
            </Text>
          </Pressable>
        </View>
      </View>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    maxHeight: "90%", // 👈 prevents overflow on small screens
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  content: {
    flexGrow: 1,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#1e88e5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  scrollContent: {
      maxHeight: "70%", // ensures scrolling before it grows too big
      backgroundColor: '#ddd',
      borderRadius: 10,
    },
});
