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
import { LinearGradient } from "expo-linear-gradient";

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

  // --- BLOCK 1: NO TEAMS CHOSEN OR BLANK LIST ---
  if (!allTeams || allTeams.length === 0) {
    const handleSetup = () => {
      console.log("hitting me here?");
      handleExitNoSave();
    };

    return (
      <View style={styles.glassCard}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#7fdaff", "#ddb7ff", "#f8ca11"]}
          style={styles.topGradientBar}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.title}>No teams selected</Text>

          <Pressable onPress={handleSetup} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Select Teams & Setup Game
            </Text>
          </Pressable>
        </View>
      </View>
    );
  } // 👈 FIXED: Safely closed the 'no teams' validation block here

  // --- BLOCK 2: SELECT BATTING TEAM ---
  if (!selectedBattingTeamId) {
    return (
      <View style={styles.glassCard}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#7fdaff", "#ddb7ff", "#f8ca11"]}
          style={styles.topGradientBar}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Select Batting Team</Text>

          {allTeams.map((team) => (
            <Pressable
              key={team.id}
              onPress={async () => {
                const otherTeam = allTeams.find((t) => t.id !== team.id);
                const targetBattingId = team.id;
                const targetBowlingId = otherTeam?.id ?? "";

                onSelectTeam(targetBattingId, targetBowlingId);

                try {
                  await updateCurrentGameData(targetBattingId, {
                    battingTeamId: targetBattingId,
                    bowlingTeamId: targetBowlingId,
                  });
                } catch (error) {
                  console.error(
                    "Failed to sync currentGame to Firebase:",
                    error,
                  );
                }
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{team.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // --- BLOCK 3: SHOW SELECTED TEAM ---
  if (legalBallsBowled === 0) {
    const team = allTeams.find((t) => t.id === selectedBattingTeamId);

    return (
      <View style={styles.glassCard}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#7fdaff", "#ddb7ff", "#f8ca11"]}
          style={styles.topGradientBar}
        />

        <View style={styles.contentContainer}>
          <View style={styles.confirmRow}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="check" size={16} color="#001f29" />
            </View>
            <Text style={styles.selectedText}>{team?.name} batting</Text>
          </View>

          <Pressable onPress={onReset} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change Team</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
} // 👈 FIXED: Added missing closing bracket for the parent component function

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: "rgba(45, 52, 73, 0.7)",
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    width: "100%",
    alignSelf: "center",
    marginHorizontal: 5,
    marginVertical: 10,
  },
  topGradientBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "700",
    color: "#dae2fd",
    marginBottom: 16,
  },
  primaryButton: {
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 194, 243, 0.15)",
    borderWidth: 1.5,
    borderColor: "#00c2f3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  primaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    color: "#7fdaff",
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  changeButton: {
    paddingVertical: 12,
    backgroundColor: "rgba(255, 180, 171, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 171, 0.25)",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  changeButtonText: {
    fontFamily: "Plus Jakarta Sans",
    color: "#ffb4ab",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7fdaff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
    color: "#dae2fd",
  },
});
