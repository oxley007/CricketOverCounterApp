// src/components/Seasons/SeasonPickerModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../../state/gameStore";

interface Props {
  visible: boolean;
  title: string;
  onSelect: (season: string) => void;
  onClose: () => void;
}

export default function SeasonPickerModal({
  visible,
  title,
  onSelect,
  onClose,
}: Props) {
  const [newSeason, setNewSeason] = useState("");

  const { seasons, addSeason } = useGameStore();

  const onAddSeason = () => {
    const trimmed = newSeason.trim();
    if (!trimmed) return;

    // avoid duplicates
    if (!seasons.includes(trimmed)) {
      addSeason(trimmed);
    }

    onSelect(trimmed);
    setNewSeason("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>

            {/* EMPTY STATE */}
            {seasons.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No seasons yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first season to get started
                </Text>
              </View>
            )}

            {/* SEASON LIST */}
            {seasons.length > 0 && (
              <FlatList
                data={seasons}
                keyExtractor={(item) => item}
                contentContainerStyle={{ paddingBottom: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.row}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={styles.rowText}>{item}</Text>
                  </Pressable>
                )}
              />
            )}

            {/* ADD SEASON */}
            <View style={styles.addSection}>
              <TextInput
                style={styles.input}
                placeholder="New season"
                value={newSeason}
                onChangeText={setNewSeason}
              />
              <Pressable style={styles.addButton} onPress={onAddSeason}>
                <Text style={styles.addButtonText}>Add Season</Text>
              </Pressable>
            </View>

            {/* CLOSE BUTTON */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
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
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowText: {
    fontSize: 18,
  },
  addSection: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#12c2e9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
    color: "#666",
  },
});
