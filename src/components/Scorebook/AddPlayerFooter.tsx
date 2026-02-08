// src/components/Scorebook/AddPlayerFooter.tsx
// Caller-owned "Add player" UI for use inside SelectPlayersModal's renderFooter.
// Uses teamStore; only use when the list comes from a team roster.
"use client";

import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useTeamStore } from "../../state/teamStore";

type AddPlayerFooterProps = {
  teamId: string;
  onAdded?: () => void;
};

export default function AddPlayerFooter({ teamId, onAdded }: AddPlayerFooterProps) {
  const [name, setName] = useState("");
  const addPlayer = useTeamStore((s) => s.addPlayer);

  const handleAdd = () => {
    if (!name.trim()) return;
    const player = addPlayer(teamId, name.trim());
    if (player) {
      setName("");
      onAdded?.();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>Add Players</Text>
      <View style={styles.row}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New player name"
          style={styles.input}
        />
        <Pressable onPress={handleAdd} style={styles.button}>
          <Text style={styles.buttonText}>+ Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  button: {
    backgroundColor: "#12c2e9",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
