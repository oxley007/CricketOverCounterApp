// src/components/RunModal/PlayerSelectorRow.tsx
// Reusable row for selecting batter or bowler in RunModal (and elsewhere).
"use client";

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export interface PlayerSelectorRowProps {
  label: string;
  /** Display name of the selected player, or placeholder when none. */
  selectedName: string | null;
  placeholder?: string;
  onPress: () => void;
}

const DEFAULT_PLACEHOLDER = "Select…";

export default function PlayerSelectorRow({
  label,
  selectedName,
  placeholder = DEFAULT_PLACEHOLDER,
  onPress,
}: PlayerSelectorRowProps) {
  const display = selectedName?.trim() || placeholder;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, !selectedName && styles.placeholder]} numberOfLines={1}>
        {display}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginRight: 10, minWidth: 56 },
  value: { flex: 1, fontSize: 15, color: "#0f172a" },
  placeholder: { color: "#94a3b8" },
  chevron: { fontSize: 18, color: "#94a3b8", marginLeft: 4 },
});
