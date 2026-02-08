// src/components/Scorebook/BattersPicker.tsx
"use client";

import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import SelectPlayersModal from "./SelectPlayersModal";
import AddPlayerFooter from "./AddPlayerFooter";
import { useGameStore } from "../../state/gameStore";
import type { Team } from "../../state/teamStore";

interface BattersPickerProps {
  battingTeam: Team | null;
  selectedBatters: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function BattersPicker({
  battingTeam,
  selectedBatters,
  onSelectionChange,
}: BattersPickerProps) {
  const [showModal, setShowModal] = useState(false);

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
        const exists = gameState.currentGame?.batters.find((b) => b.playerId === playerId);
        if (!exists) addBatter(playerId);
      });

      // 🔹 Restore currentStrikeId if missing
      const currentGame = useGameStore.getState().currentGame;
      if (currentGame && !currentGame.currentStrikeId && selectedBatters.length > 0) {
        setStrike(selectedBatters[0]);
      }
    }
  }, [battingTeam, selectedBatters]);

  const handleCloseModal = () => setShowModal(false);

  const getBatterStats = (playerId: string) => {
    if (!currentGame) return { runs: 0, balls: 0, strikeRate: "0.0" };
    const batter = currentGame.batters.find((b) => b.playerId === playerId);
    if (!batter) return { runs: 0, balls: 0, strikeRate: "0.0" };
    const strikeRate = batter.balls > 0 ? (batter.runs / batter.balls) * 100 : 0;
    return { runs: batter.runs, balls: batter.balls, strikeRate: strikeRate.toFixed(1) };
  };

  return (
    <>
      <Pressable style={styles.addBatters} onPress={() => setShowModal(true)}>
        <Text style={styles.addBattersTitle}>Add Batters</Text>

        {currentGame && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>🧪 Strike Debug</Text>
            <Text style={styles.debugText}>currentStrikeId: {currentGame.currentStrikeId ?? "undefined"}</Text>
            <Text style={styles.debugText}>batters in game: {currentGame.batters.length}</Text>
          </View>
        )}

        {selectedBatters.length > 0 ? (
          <View style={styles.selectedBattersContainer}>
            {battingTeam?.players
              .filter((p) => selectedBatters.includes(p.id))
              .map((p) => {
                const stats = getBatterStats(p.id);
                const onStrike = currentGame?.currentStrikeId === p.id;

                return (
                  <Pressable
                    key={p.id}
                    style={[styles.selectedBatterItem, onStrike && styles.onStrikeBatter]}
                    onPress={() => setStrike(p.id)}
                  >
                    <View style={styles.batterRow}>
                      <Text style={styles.strikeIcon}>{onStrike ? "⚡" : "  "}</Text>
                      <Text style={styles.selectedBatterText}>
                        {p.name} — {stats.runs} ({stats.balls}) SR: {stats.strikeRate}
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

      {battingTeam && (
        <SelectPlayersModal
          visible={showModal}
          onClose={handleCloseModal}
          title="Select Opening Batters"
          players={battingTeam.players}
          selectedIds={selectedBatters}
          onSelectionChange={(ids) => onSelectionChange(ids)}
          selectionMode="multiple"
          maxSelection={2}
          renderFooter={() => <AddPlayerFooter teamId={battingTeam.id} />}
        />
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
  addBattersTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
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
  selectedBatterItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  selectedBatterText: { fontSize: 16, color: "#0f172a", fontWeight: "500" },
  batterRow: { flexDirection: "row", alignItems: "center" },
  strikeIcon: { width: 20, textAlign: "center", marginRight: 8, fontWeight: "700", color: "#12c2e9" },
  onStrikeBatter: { borderColor: "#12c2e9", borderWidth: 2, backgroundColor: "#e0f7ff", borderRadius: 8 },
  debugBox: { marginTop: 8, padding: 8, backgroundColor: "#f8fafc", borderRadius: 8 },
  debugTitle: { fontSize: 12, fontWeight: "700" },
  debugText: { fontSize: 12 },
});
