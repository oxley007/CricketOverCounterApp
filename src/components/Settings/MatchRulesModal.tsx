import { router } from "expo-router";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useStartModalStore } from "../../state/startModalStore";
import WicketsNegativeInfo from "./WicketsNegativeInfo";
import { updatebaseRunsData } from "@/src/services/firestoreService";

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
  //const startFixture = useFixtureStore((s) => s.startFixture);
  //const addInnings = useFixtureStore((s) => s.addInnings);
  const wicketsAsNegativeRuns = useMatchStore((s) => s.wicketsAsNegativeRuns);

  const baseRuns = useMatchStore((s) => s.baseRuns ?? 0);

  // Inside MatchRulesModal component:
  const fixtureTeamId = useFixtureStore((s) => s.currentFixture?.yourTeam?.id);
  const gameTeamId = useGameStore((s) => (s as any).yourTeam?.id);

  // 🔍 Track exactly which hook is feeding the component the wrong data
  console.log("🔍 Debug Hook Output [Fixture Store Team ID]:", fixtureTeamId);
  console.log("🔍 Debug Hook Output [Game Store Team ID]:", gameTeamId);

  const teamId = fixtureTeamId || gameTeamId || "";

  const handleBack = () => {
    // Remove any partial fixture
    //useFixtureStore.setState({ currentFixture: undefined });

    // Reset game state
    //useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();

    // Reset start modal state
    const startModal = useStartModalStore.getState();
    startModal.reset();

    // Close setup modal
    onClose();

    // Navigate to root
    router.replace("/");

    // Open start modal after navigation
    setTimeout(() => {
      useStartModalStore.getState().open();
      //startModal.reset();
      startModal.open();
    }, 120);
  };

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
              {wicketsAsNegativeRuns && <WicketsNegativeInfo />}

              {/* 👇 CONTENT COMES FROM PARENT */}
              <View style={styles.content}>{children}</View>
            </ScrollView>
            <Pressable
              style={styles.button}
              onPress={() => {
                // 🚀 3. Push the data to Firestore before closing
                updatebaseRunsData(teamId, baseRuns);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save & Continue</Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Cancel</Text>
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
    backgroundColor: "#ddd",
    borderRadius: 10,
  },
  backButton: {
    //position: "absolute",
    //top: 12,
    //left: 12,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 20,
  },

  backButtonText: {
    fontSize: 16,
    color: "#666",
  },
});
