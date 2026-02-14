// src/components/Scorebook/DismissBatterModal.tsx
import React, { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Batter {
  id: string;
  name: string;
}

interface DismissBatterModalProps {
  visible: boolean;
  batters: Batter[];
  currentBatterId: string | null;
  onClose: () => void;
  onContinue: (selectedId: string) => void;
}

export default function DismissBatterModal({
  visible,
  batters,
  currentBatterId,
  onClose,
  onContinue,
}: DismissBatterModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentBatterId);

  // Reset selection if modal reopens
  useEffect(() => {
    if (visible) setSelectedId(currentBatterId);
  }, [visible, currentBatterId]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Dismissed Batter</Text>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {batters.map((b) => (
              <Pressable
                key={b.id}
                style={[
                  styles.optionButton,
                  selectedId === b.id && styles.optionSelected,
                ]}
                onPress={() => setSelectedId(b.id)}
              >
                <Text style={styles.optionText}>{b.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={styles.submitButton}
            onPress={() => selectedId && onContinue(selectedId)}
          >
            <Text style={styles.submitText}>Continue</Text>
          </Pressable>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  scrollContent: { paddingBottom: 20 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  optionButton: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  optionSelected: { backgroundColor: "#77dd77" },
  optionText: { fontSize: 16, fontWeight: "600" },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#77dd77",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  closeButton: { marginTop: 10, alignItems: "center", marginBottom: 5 },
  closeText: { color: "#c471ed", fontSize: 16, fontWeight: "600" },
});
