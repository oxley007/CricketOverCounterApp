// src/components/Scorebook/AddPlayerFooter.tsx
// Caller-owned "Add player" UI for use inside SelectPlayersModal's renderFooter.
// Uses teamStore; only use when the list comes from a team roster.
"use client";

import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTeamStore } from "../../state/teamStore";

type AddPlayerFooterProps = {
  teamId: string;
  onAdded?: (name: string) => void;
};

export default function AddPlayerFooter({
  teamId,
  onAdded,
}: AddPlayerFooterProps) {
  const [name, setName] = useState("");
  const addPlayer = useTeamStore((s) => s.addPlayer);

  const inputRef = useRef<TextInput>(null); // 2. Create the ref

  const handleAdd = () => {
    if (!name.trim()) return;

    onAdded?.(name.trim());

    // 3. Directly tell the native component to clear
    inputRef.current?.clear();

    // 4. Update the state just to be sure
    setName("");
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Add Players</Text>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={name}
          onChangeText={setName}
          placeholder="New player name"
          style={styles.input}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
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
