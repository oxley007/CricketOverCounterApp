import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

interface Props {
  value: number | null;
  onChange: (runs: number | null) => void;
}

export default function CustomRunsInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false); // input mode
  const [submitted, setSubmitted] = useState(false); // display mode after submit
  const [text, setText] = useState(value ? String(value) : "");

  useEffect(() => {
    // keep text in sync if parent changes value
    if (value !== null) {
      setText(String(value));
      setSubmitted(true);
      setOpen(false);
    }
  }, [value]);

  const handleSubmit = () => {
    const num = Number(text);
    if (!isNaN(num) && num >= 7) {
      onChange(num);
      setSubmitted(true);
      setOpen(false);
    }
  };

  const handleEdit = () => {
    setOpen(true);
    setSubmitted(false);
  };

  return (
    <View style={{ marginTop: 6 }}>
      {/* Initial "link" before submit */}
      {!open && !submitted && (
        <Pressable onPress={() => setOpen(true)}>
          <Text style={styles.link}>Custom runs</Text>
        </Pressable>
      )}

      {/* Input mode */}
      {open && (
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            keyboardType="number-pad"
            placeholder="Enter runs (i.e. 7)"
          />
          <Pressable onPress={handleSubmit}>
            <Text style={styles.done}>Submit</Text>
          </Pressable>
        </View>
      )}

      {/* Display mode after submit */}
      {submitted && !open && (
        <View style={styles.row}>
          <Text style={styles.submittedText}>{text} runs</Text>
          <Pressable onPress={handleEdit}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
    fontSize: 14,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 80,
  },
  done: {
    color: "#007AFF",
    fontWeight: "600",
  },
  submittedText: {
    fontSize: 16,
    fontWeight: "600",
  },
  edit: {
    color: "#007AFF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
