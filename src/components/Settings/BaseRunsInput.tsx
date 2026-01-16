// src/components/BaseRunsInput.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useMatchStore } from "../../state/matchStore";

export default function BaseRunsInput() {
  const baseRuns = useMatchStore((s) => s.baseRuns);
  const setBaseRuns = useMatchStore((s) => s.setBaseRuns);

  return (
    <View>
      <Text style={styles.label}>Starting runs</Text>
      <Text style={styles.help}>
        Add runs to the starting score. Commonly used in junior cricket. i.e. you could start the innings with 100 runs.
      </Text>

      <TextInput
        keyboardType="number-pad"
        value={String(baseRuns)}
        onChangeText={(val) =>
          setBaseRuns(Number(val) || 0)
        }
        style={styles.input}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    color: "#000", // <-- black text
    padding: 8,
    marginBottom: 8,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: "#fff", // optional: ensures white input box
  },
  help: {
    color: '#444',
    fontSize: 12
  }
});
