// src/components/Scorebook/BattingTeamSelector.tsx
"use client";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useStartModalStore } from "../../state/startModalStore";
import type { Team } from "../../state/teamStore";

interface BattingTeamSelectorProps {
  allTeams: Team[];
  selectedBattingTeamId: string | null;
  bowlingTeamId: string | null;
  legalBallsBowled: number;
  onSelectTeam: (battingTeamId: string, bowlingTeamId: string) => void;
  onReset: () => void;
}

export default function BattingTeamSelector({
  allTeams,
  selectedBattingTeamId,
  bowlingTeamId,
  legalBallsBowled,
  onSelectTeam,
  onReset,
}: BattingTeamSelectorProps) {
  const router = useRouter();
  const { selectedMode, close, selectBallCounter, selectScorebook } =
    useStartModalStore();

  if (!allTeams || allTeams.length === 0) {
    const handleSetup = () => {
      close();

      const game = useGameStore.getState();
      game.triggerSetup();

      if (selectedMode === "ballCounter") {
        selectBallCounter();

        setTimeout(() => {
          router.replace("/ball-counter");
        }, 100);
      } else if (selectedMode === "scorebook") {
        selectScorebook();

        setTimeout(() => {
          router.replace("/scorebook");
        }, 100);
      }
    };

    return (
      <View style={styles.card}>
        <Text style={styles.title}>No teams selected</Text>

        <Pressable onPress={handleSetup} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            Select teams for this game
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!selectedBattingTeamId) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Select Batting Team</Text>

        {allTeams.map((team) => (
          <Pressable
            key={team.id}
            onPress={() => {
              const otherTeam = allTeams.find((t) => t.id !== team.id);
              onSelectTeam(team.id, otherTeam?.id ?? "");
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{team.name}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  // 👇 SHOW SELECTED TEAM (before scoring starts)
  if (legalBallsBowled === 0) {
    const team = allTeams.find((t) => t.id === selectedBattingTeamId);

    return (
      <View style={styles.card}>
        <View style={styles.confirmRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={18} color="#fff" />
          </View>

          <Text style={styles.selectedText}>{team?.name} batting</Text>
        </View>

        <Pressable onPress={onReset} style={styles.changeButton}>
          <Text style={styles.changeButtonText}>Change Team</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#12c2e9",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },

  primaryButton: {
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#12c2e9",
    borderRadius: 8,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  changeButton: {
    paddingVertical: 10,
    backgroundColor: "#e0f7ff",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  changeButtonText: {
    color: "#12c2e9",
    fontWeight: "600",
    fontSize: 15,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: "#16a34a", // stronger green
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  selectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  changeInline: {
    color: "#12c2e9",
    fontWeight: "600",
    fontSize: 14,
  },
});
