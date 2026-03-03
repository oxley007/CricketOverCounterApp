import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useRouter } from "expo-router";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import EndGameModal from "./EndGameModal";
import NewInningsButton from "./NewInningsButton";

type EndInningsButtonProps = {
  onComplete?: () => void;
};

export default function EndInningsButton({
  onComplete,
}: EndInningsButtonProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Live store resets
  const resetInnings = useMatchStore((s) => s.resetInnings);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetBatters = useGameStore((s) => s.resetBatters);

  const resetStartModal = useStartModalStore((s) => s.reset);

  const [modalFixture, setModalFixture] = useState<any | null>(null); // snapshot for modal
  const [modalVisible, setModalVisible] = useState(false);

  const allFixtures = useFixtureStore.getState().fixtures;
  console.log("📦 All fixtures:", JSON.stringify(allFixtures, null, 2));

  /* ======================== END GAME (SAVE) ======================== */
  const handleEndGame = () => {
    setVisible(false);

    const fixtureStore = useFixtureStore.getState();

    // Save + complete fixture
    fixtureStore.saveCurrentInnings();
    fixtureStore.completeFixture();
    const updatedFixtures = fixtureStore.fixtures;
    const completedFixture = updatedFixtures[updatedFixtures.length - 1];
    setModalFixture(completedFixture);

    // Reset stores
    // Reset stores
    resetInnings();
    resetBatters();
    resetGame();

    // Reset start modal (opens "Select your mode")
    resetStartModal();

    // Navigate back to index
    router.replace("/");
  };

  /* ======================== ABANDON MATCH ======================== */
  const handleAbandonMatch = () => {
    setVisible(false);

    const fixtureStore = useFixtureStore.getState();

    // 1️⃣ Save current innings
    fixtureStore.saveCurrentInnings();

    // 2️⃣ Mark abandoned (adds to fixtures[], clears currentFixture)
    fixtureStore.markFixtureAbandoned();

    // 3️⃣ Grab the final stored fixture
    const updatedFixtures = fixtureStore.getState().fixtures;
    const abandonedFixture = updatedFixtures[updatedFixtures.length - 1];

    console.log(
      "📸 Final abandoned fixture passed to modal:",
      JSON.stringify(abandonedFixture, null, 2),
    );

    setModalFixture(abandonedFixture);

    // Reset stores
    // Reset stores
    resetInnings();
    resetBatters();
    resetGame();

    // Reset start modal (opens "Select your mode")
    resetStartModal();

    // Navigate back to index
    router.replace("/");
  };

  /* ======================== END GAME WITHOUT SAVE ======================== */
  const handleEndGameNoSave = () => {
    setVisible(false);

    const fixtureStore = useFixtureStore.getState();

    const fixtureSnapshot = JSON.parse(
      JSON.stringify(fixtureStore.currentFixture),
    );

    setModalFixture(fixtureSnapshot);

    fixtureStore.clearCurrentFixture();

    // Reset stores
    // Reset stores
    resetInnings();
    resetBatters();
    resetGame();

    // Reset start modal (opens "Select your mode")
    resetStartModal();

    // Navigate back to index
    router.replace("/");
  };

  return (
    <View>
      {/* END INNINGS BUTTON */}
      <Button
        mode="contained"
        onPress={() => setVisible(true)}
        style={styles.button}
        icon={() => <Icon name="flag-checkered" size={20} color="#c471ed" />}
        labelStyle={styles.buttonLabel}
      >
        End Innings
      </Button>

      {/* OPTIONS MODAL */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.title}>End current innings?</Text>
          <Text style={styles.subtitle}>
            Choose what you would like to do next.
          </Text>

          <NewInningsButton onComplete={() => setVisible(false)} />

          <View style={styles.actionsColumn}>
            <Button
              mode="contained"
              buttonColor="#f97316"
              onPress={handleAbandonMatch}
            >
              Match Abandoned (save, no result)
            </Button>

            <Button
              mode="contained"
              buttonColor="#c471ed"
              onPress={handleEndGame}
              style={styles.primaryAction}
            >
              End Game (Save, with result)
            </Button>

            <Button
              mode="outlined"
              buttonColor="#888"
              onPress={handleEndGameNoSave}
            >
              End Game Without Saving
            </Button>

            <Button onPress={() => setVisible(false)}>Cancel</Button>
          </View>
        </Modal>
      </Portal>

      {/* END GAME SUMMARY MODAL */}
      {modalFixture && (
        <EndGameModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          fixture={modalFixture}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    marginTop: 10,
  },
  buttonLabel: {
    color: "#c471ed",
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
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
});
