// src/components/Scorebook/BattingTeamSelector.tsx
"use client";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import type { Team } from "../../state/teamStore";
import { resetGuestIfNeeded } from "../../utils/authHelpers";
import { useExitGame } from "../../hooks/useExitGame";
import { updateCurrentGameData } from "@/src/services/firestoreService";

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

  const { handleExitNoSave, isExiting } = useExitGame();

  if (!allTeams || allTeams.length === 0) {
    const handleSetup = () => {
      console.log("hitting me here?");
      handleExitNoSave();

      /*
      const startModalStore = useStartModalStore.getState();
      const gameStore = useGameStore.getState();

      // 1️⃣ Cleanup (same as drawer)
      resetGuestIfNeeded();
      useFixtureStore.getState().saveCurrentInnings();
      useFixtureStore.setState({ currentFixture: undefined });
      useMatchStore.getState().resetInnings();

      gameStore.resetGame();
      gameStore.resetBatters();
      gameStore.setSetupComplete(false);
      gameStore.triggerSetup();

      // 2️⃣ Reset modal state properly
      startModalStore.reset();
      startModalStore.open();

      // 3️⃣ Navigate (go to setup flow, not back into game)
      setTimeout(() => {
        router.replace("/");
      }, 0);
      */
    };

    return (
      <View style={styles.card}>
        <Text style={styles.title}>No teams selected</Text>

        <Pressable onPress={handleSetup} style={styles.primaryButton}>
          <Text style={styles.primaryButtonTextTwo}>
            Select Teams & Setup Game
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
            onPress={async () => {
              const otherTeam = allTeams.find((t) => t.id !== team.id);
              const targetBattingId = team.id;
              const targetBowlingId = otherTeam?.id ?? "";

              // 1. Update your local state via props
              onSelectTeam(targetBattingId, targetBowlingId);

              // 2. Sync currentGame immediately to Firebase for live viewers
              try {
                await updateCurrentGameData(targetBattingId, {
                  battingTeamId: targetBattingId,
                  bowlingTeamId: targetBowlingId,
                  // Include any other required fields for your currentGame schema here
                });
              } catch (error) {
                console.error("Failed to sync currentGame to Firebase:", error);
              }
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
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Matches dark cyan dashboard theme
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 5,
    borderLeftColor: "#ffd54f", // Accent line shifted to amber yellow for dark backdrop punch
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff", // Primary label swapped to pure white
    marginBottom: 12,
  },

  primaryButton: {
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff", // Crisp white background action button
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },

  primaryButtonText: {
    color: "#0e9cb9", // Text matches card background color for clean style
    fontWeight: "700",
    fontSize: 16,
  },
  primaryButtonTextTwo: {
    color: "#0e9cb9",
    fontWeight: "700",
    fontSize: 16,
    padding: 10,
  },

  changeButton: {
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Clean white glassmorphism layer
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  changeButtonText: {
    color: "#ffffff", // Pure white for text visibility on secondary layers
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#66bb6a", // Premium emerald green
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  selectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff", // Pure white status description
  },

  changeInline: {
    color: "#b2ebf2", // Soft secondary tint color link line
    fontWeight: "600",
    fontSize: 14,
  },
});
