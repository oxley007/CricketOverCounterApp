// src/components/Scorebook/BattersPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import type { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";

interface BattersPickerProps {
  battingTeam: Team | null;
  allTeams: Team[];
  selectedBatters: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function BattersPicker({
  battingTeam,
  allTeams,
  selectedBatters,
  onSelectionChange,
}: BattersPickerProps) {
  const [showModal, setShowModal] = useState(false);

  const [selectedBattingTeamId, setSelectedBattingTeamId] = useState<
    string | null
  >(battingTeam?.id ?? null);

  const currentGame = useGameStore((s) => s.currentGame);
  const startGame = useGameStore((s) => s.startGame);
  const addBatter = useGameStore((s) => s.addBatter);
  const setStrike = useGameStore((s) => s.setStrike);

  // When selectedBatters changes, add missing batters to the game
  useEffect(() => {
    if (!battingTeam || selectedBatters.length === 0) return;

    const gameState = useGameStore.getState();

    // Start game if it doesn't exist yet
    if (!gameState.currentGame) {
      console.log("🟢 Starting new game");
      startGame(battingTeam.id, selectedBatters); // 🔹 pass selected batters here
    } else {
      // Add all selected batters that aren't already in the game
      selectedBatters.forEach((playerId) => {
        const exists = gameState.currentGame?.batters.find(
          (b) => b.playerId === playerId,
        );
        if (!exists) addBatter(playerId);
      });

      // 🔹 Restore currentStrikeId if missing
      const currentGame = useGameStore.getState().currentGame;
      if (
        currentGame &&
        !currentGame.currentStrikeId &&
        selectedBatters.length > 0
      ) {
        setStrike(selectedBatters[0]);
      }
    }
  }, [battingTeam, selectedBatters]);

  const handleCloseModal = () => setShowModal(false);

  const getBatterStats = (playerId: string) => {
    if (!currentGame) return { runs: 0, balls: 0, strikeRate: "0.0" };
    const batter = currentGame.batters.find((b) => b.playerId === playerId);
    if (!batter) return { runs: 0, balls: 0, strikeRate: "0.0" };
    const strikeRate =
      batter.balls > 0 ? (batter.runs / batter.balls) * 100 : 0;
    return {
      runs: batter.runs,
      balls: batter.balls,
      strikeRate: strikeRate.toFixed(1),
    };
  };

  const battingTeamObj =
    currentGame?.teams?.find((t) => t.id === selectedBattingTeamId) ?? null;

  const battingTeamPlayers =
    currentGame?.teams?.find((t) => t.id === selectedBattingTeamId)?.players ??
    allTeams.find((t) => t.id === selectedBattingTeamId)?.players ??
    [];

  const addPlayerToTeam = useTeamStore((s) => s.addPlayer);

  return (
    <>
      {selectedBattingTeamId &&
        currentGame &&
        (currentGame.events ?? []).filter((e) => e.countsAsBall).length ===
          0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {allTeams.find((t) => t.id === selectedBattingTeamId)?.name}{" "}
              batting first
            </Text>
            <Pressable
              onPress={() => setSelectedBattingTeamId(null)}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: "#eee", fontWeight: "600" }}>(change)</Text>
            </Pressable>
          </View>
        )}

      {/* Choose batting team if not already selected */}
      {!selectedBattingTeamId && allTeams.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>
            Select Batting Team:
          </Text>
          {allTeams.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => handleSelectBattingTeam(team.id)}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#f0f0f0",
                marginBottom: 6,
              }}
            >
              <Text>{team.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Show Add Batters button and selected batters only after team is chosen */}
      {selectedBattingTeamId && (
        <>
          <Pressable
            style={styles.addBatters}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addBattersTitle}>Add Batters</Text>
            {selectedBatters.length > 0 ? (
              <View style={styles.selectedBattersContainer}>
                {battingTeamPlayers
                  .filter((p) => selectedBatters.includes(p.id))
                  .map((p) => {
                    const stats = getBatterStats(p.id);
                    const onStrike = currentGame?.currentStrikeId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        style={[
                          styles.selectedBatterItem,
                          onStrike && styles.onStrikeBatter,
                        ]}
                        onPress={() => setStrike(p.id)}
                      >
                        <View style={styles.batterRow}>
                          <Text style={styles.strikeIcon}>
                            {onStrike ? "⚡" : "  "}
                          </Text>
                          <Text style={styles.selectedBatterText}>
                            {p.name} — {stats.runs} ({stats.balls}) SR:{" "}
                            {stats.strikeRate}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
              </View>
            ) : (
              <Text>Select opening batters to start scoring</Text>
            )}
          </Pressable>

          <SelectPlayersModal
            visible={showModal}
            onClose={handleCloseModal}
            title={`Select Opening Batters for ${battingTeamObj?.name ?? ""}`}
            players={battingTeamPlayers}
            selectedIds={selectedBatters}
            onSelectionChange={onSelectionChange}
            selectionMode="multiple"
            maxSelection={2}
            renderFooter={() => (
              <AddPlayerFooter
                teamId={selectedBattingTeamId}
                onAdded={(name) => {
                  if (!selectedBattingTeamId) return;
                  addPlayerToTeam(selectedBattingTeamId, name);
                }}
              />
            )}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addBatters: {
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
  addBattersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  selectedBattersContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#12c2e9",
  },
  selectedBatterItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedBatterText: { fontSize: 16, color: "#0f172a", fontWeight: "500" },
  batterRow: { flexDirection: "row", alignItems: "center" },
  strikeIcon: {
    width: 20,
    textAlign: "center",
    marginRight: 8,
    fontWeight: "700",
    color: "#12c2e9",
  },
  onStrikeBatter: {
    borderColor: "#12c2e9",
    borderWidth: 2,
    backgroundColor: "#e0f7ff",
    borderRadius: 8,
  },
  debugBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  debugTitle: { fontSize: 12, fontWeight: "700" },
  debugText: { fontSize: 12 },
});
