import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import { useMatchStore } from "../state/matchStore";
import { useGameStore } from "../state/gameStore";
import { useStartModalStore } from "../state/startModalStore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type ResetButtonProps = {
  onReset?: () => void;
};

export default function ResetButton({ onReset }: ResetButtonProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Store actions
  const resetInnings = useMatchStore((s) => s.resetInnings);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetBatters = useGameStore((s) => s.resetBatters);

  // clearer naming
  const resetStartModal = useStartModalStore((s) => s.reset);

  const handleConfirmReset = () => {
    setConfirmVisible(false);

    // ✅ Correct reset order
    resetInnings();
    resetBatters();
    resetGame();

    // Optional parent cleanup
    onReset?.();

    // Show start modal again
    resetStartModal();
  };

  return (
    <View>
      <Button
        mode="contained"
        onPress={() => setConfirmVisible(true)}
        style={styles.resetButton}
        icon={() => <Icon name="refresh" size={20} color="#c471ed" />}
        labelStyle={styles.buttonLabel}
      >
        Reset Ball Counter
      </Button>

      <Portal>
        <Modal
          visible={confirmVisible}
          onDismiss={() => setConfirmVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Reset match?</Text>
          <Text style={styles.modalText}>
            Are you sure you want to reset the match? This will remove all game
            data and cannot be undone.
          </Text>

          <View style={styles.modalActions}>
            <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor="#c471ed"
              onPress={handleConfirmReset}
            >
              Reset
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  resetButton: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    color: "#555",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});
