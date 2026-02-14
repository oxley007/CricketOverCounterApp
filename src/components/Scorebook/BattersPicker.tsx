// src/components/Scorebook/BattersPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import type { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";

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
  const selectedBattingTeamId = currentGame?.battingTeamId ?? null;
  const addBatter = useGameStore((s) => s.addBatter);
  const setStrike = useGameStore((s) => s.setStrike);
  const matchEvents = useMatchStore((s) => s.events);
  const startGame = useGameStore((s) => s.startGame);

  const addPlayerToTeam = useTeamStore((s) => s.addPlayer);

  const legalBallsBowled = matchEvents.reduce(
    (count, e) => count + (e.countsAsBall ? 1 : 0),
    0,
  );

  const handleCloseModal = () => setShowModal(false);

  //const batters = useGameStore((s) => s.currentGame?.batters ?? []);

  const getBatterStats = (playerId: string) => {
    const eventsForBatter = matchEvents.filter((e) => e.batterId === playerId);
    const runs = eventsForBatter.reduce((sum, e) => sum + (e.runs ?? 0), 0);
    const balls = eventsForBatter.filter((e) => e.countsAsBall).length;
    const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
    return { runs, balls, strikeRate: strikeRate.toFixed(1) };
  };

  const shouldShowChangeBatters = (() => {
    const stats = selectedBatters.map((id) => getBatterStats(id));

    if (stats.length === 0) return false; // no batters selected

    // Show button if any batter has BOTH runs === 0 AND balls === 0
    return stats.some((b) => b.runs === 0 && b.balls === 0);
  })();

  const battingTeamPlayers = battingTeam?.players ?? [];

  const battersIds = currentGame?.batters.map((b) => b.playerId) ?? [];

  useEffect(() => {
    if (!battingTeam) return;

    const gameState = useGameStore.getState();

    // Start the game if it doesn't exist yet
    if (!gameState.currentGame) {
      if (selectedBatters.length > 0)
        startGame(battingTeam.id, selectedBatters);
      return;
    }

    const currentBatters = gameState.currentGame.batters ?? [];

    // 1️⃣ Remove batters not in selectedBatters
    const filteredBatters = currentBatters.filter((b) =>
      selectedBatters.includes(b.playerId),
    );
    if (filteredBatters.length !== currentBatters.length) {
      gameState.updateCurrentGame({
        ...gameState.currentGame,
        batters: filteredBatters,
      });
    }

    // 2️⃣ Add any new selected batters not already in the game
    selectedBatters.forEach((playerId) => {
      const exists = filteredBatters.find((b) => b.playerId === playerId);
      if (!exists) addBatter(playerId);
    });

    // 3️⃣ Ensure a batter is on strike
    const currentGameState = useGameStore.getState().currentGame;

    if (currentGameState) {
      const desiredStrike = selectedBatters[0] ?? null;

      if (desiredStrike && currentGameState.currentStrikeId !== desiredStrike) {
        setStrike(desiredStrike);
      }
    }
  }, [battingTeam?.id, selectedBatters.join(",")]);

  return (
    <>
      {battingTeam && (
        <>
          <Pressable
            style={styles.addBatters}
            onPress={() => setShowModal(true)}
          >
            {shouldShowChangeBatters && (
              <Pressable
                style={[styles.addBowlerButton, { marginTop: 12 }]}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.addBowlerButtonText}>Change Batters</Text>
              </Pressable>
            )}

            {selectedBatters.length > 0 ? (
              <View style={styles.selectedBattersContainer}>
                {battingTeamPlayers
                  .filter((p) => battersIds.includes(p.id))
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
              <View>
                <Text>Select opening batters to start scoring</Text>
                <Pressable
                  style={[styles.addBowlerButton, { marginTop: 12 }]}
                  onPress={() => setShowModal(true)}
                >
                  <Text style={styles.addBowlerButtonText}>Add Batters</Text>
                </Pressable>
              </View>
            )}
          </Pressable>

          <SelectPlayersModal
            visible={showModal}
            onClose={handleCloseModal}
            title={`Select Opening Batters for ${battingTeam?.name ?? ""}`}
            players={battingTeamPlayers}
            selectedIds={selectedBatters}
            onSelectionChange={onSelectionChange}
            selectionMode="multiple"
            maxSelection={2}
            renderFooter={() => (
              <AddPlayerFooter
                teamId={selectedBattingTeamId!}
                onAdded={(name) => {
                  addPlayerToTeam(selectedBattingTeamId!, name);
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
  addBowlerButton: {
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#12c2e9",
    borderRadius: 8,
    alignItems: "center",
  },
  addBowlerButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
