import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveTeam } from "../../services/firestoreService";
import { Team, useTeamStore } from "../../state/teamStore";

interface Props {
  visible: boolean;
  title: string;
  onSelect: (team: Team) => void;
  onClose: () => void;
}

export default function TeamPickerModal({
  visible,
  title,
  onSelect,
  onClose,
}: Props) {
  const { teams, addTeam } = useTeamStore();
  const [newTeamName, setNewTeamName] = useState("");

  const onAddTeam = async () => {
    if (!newTeamName.trim()) return;

    const team = addTeam(newTeamName.trim());
    if (!team) return;

    setNewTeamName("");

    try {
      await saveTeam(team);
      onSelect(team);
    } catch (err) {
      console.error("❌ Error saving team:", err);
      Alert.alert("Error", "Failed to save team. Try again.");
    }
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
            <Text style={styles.title}>{title}</Text>

            {/* EMPTY STATE */}
            {teams.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No teams yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first team to get started
                </Text>
              </View>
            )}

            {/* TEAM LIST */}
            {teams.length > 0 && (
              <FlatList
                data={teams}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.teamRow}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={styles.teamText}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}

            {/* ADD TEAM */}
            <View style={styles.addSection}>
              <TextInput
                style={styles.input}
                placeholder="New team name"
                value={newTeamName}
                onChangeText={setNewTeamName}
              />
              <Pressable style={styles.addButton} onPress={onAddTeam}>
                <Text style={styles.addButtonText}>Add Team</Text>
              </Pressable>
            </View>

            {/* FOOTER */}
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

  teamRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  teamText: {
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
