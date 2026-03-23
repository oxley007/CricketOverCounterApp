// src/components/Scorebook/CurrentBattingDisplay.tsx
"use client";

import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";

export default function CurrentBattingDisplay() {
  const battingTeamId = useGameStore((s) => s.currentGame?.battingTeamId);
  const allTeams = useTeamStore((s) => s.teams);

  // Get ball count to determine if we should show yet
  const legalBallsBowled = useMatchStore(
    (s) => s.events.filter((e) => e.countsAsBall).length,
  );

  // ONLY show if a team is selected AND at least one ball has been bowled
  // This prevents it from appearing while the Selector is still visible
  if (!battingTeamId || !allTeams.length || legalBallsBowled === 0) {
    return null;
  }

  const team = allTeams.find((t) => t.id === battingTeamId);

  return (
    <View style={styles.card}>
      <View style={styles.confirmRow}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check" size={14} color="#fff" />
        </View>
        <Text style={styles.selectedText}>
          <Text style={styles.label}>Batting: </Text>
          {team?.name || "Unknown Team"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#12c2e9",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: {
    color: "#64748b",
    fontWeight: "400",
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
});
