import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import { useMatchStore } from "../state/matchStore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function MatchButtons() {
  const { resetInnings } = useMatchStore();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleConfirmReset = () => {
    setConfirmVisible(false);
    resetInnings();
  };

  return (
    <View>
      {/* Reset button */}
      <Button
        mode="contained"
        onPress={() => setConfirmVisible(true)}
        style={styles.resetButton}
        icon={() => <Icon name="refresh" size={20} color="#c471ed" />}
        labelStyle={styles.buttonLabel}
      >
        Reset Ball Counter
      </Button>

      {/* Confirmation modal */}
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
            <Button onPress={() => setConfirmVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmReset}
              buttonColor="#c471ed"
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
