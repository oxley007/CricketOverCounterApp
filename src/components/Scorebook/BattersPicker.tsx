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
  const hasHydrated = useGameStore((s) => s.hasHydrated);

  const addPlayerToTeam = useTeamStore((s) => s.addPlayer);

  const legalBallsBowled = matchEvents.reduce(
    (count, e) => count + (e.countsAsBall ? 1 : 0),
    0,
  );

  const handleCloseModal = () => setShowModal(false);

  //const batters = useGameStore((s) => s.currentGame?.batters ?? []);

  const getBatterStats = (playerId: string, batterInningId?: string) => {
    const eventsForBatter = matchEvents.filter(
      (e) =>
        e.batterId === playerId &&
        (!batterInningId || e.batterInningId === batterInningId),
    );

    const runs = eventsForBatter.reduce((sum, e) => sum + (e.runs ?? 0), 0);
    const balls = eventsForBatter.filter((e) => e.countsAsBall).length;
    const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;

    return { runs, balls, strikeRate: strikeRate.toFixed(1) };
  };

  console.log(
    "Persisted batters:",
    useGameStore.getState().currentGame?.batters,
  );

  const shouldShowChangeBatters = (() => {
    const stats = selectedBatters.map((id) => getBatterStats(id));

    // Hide if no balls bowled yet
    const totalBallsBowled = matchEvents.filter((e) => e.countsAsBall).length;
    if (totalBallsBowled === 0) return false;

    if (stats.length <= 1) return true; // always show if 0 or 1 batter

    // Show button if any selected batter has BOTH runs === 0 AND balls === 0
    return stats.some((b) => b.runs === 0 && b.balls === 0);
  })();

  const battingTeamPlayers = battingTeam?.players ?? [];

  // currentGame.activeBatters is string[], not objects
  const battersIds = currentGame?.activeBatters ?? [];
  const currentBatters = currentGame?.activeBatters ?? [];
  const battingEntries = currentGame?.battingEntries ?? [];

  // derive active batters for display
  const activeBatters = (currentGame?.activeBatters ?? [])
    .map(({ playerId, batterInningId }) => {
      const player = battingTeamPlayers.find((p) => p.id === playerId);
      if (!player) return null;

      const { runs, balls } = getBatterStats(playerId, batterInningId);

      return {
        ...player,
        runs,
        balls,
      };
    })
    .filter(Boolean) as ((typeof battingTeamPlayers)[0] & {
    runs: number;
    balls: number;
  })[];

  console.log("battingTeamPlayers:", battingTeamPlayers);

  console.log("Current Batters:", currentBatters);
  console.log("Batting Entries:", currentGame?.battingEntries);
  console.log("currentBatters in BattersPicker:", currentGame?.batters);

  useEffect(() => {
    if (!hasHydrated) return; // ⚠️ wait for hydration
    if (!battingTeam) return;

    const gameState = useGameStore.getState();

    // Start the game if it doesn't exist yet
    if (!gameState.currentGame) {
      if (selectedBatters.length > 0) {
        startGame(battingTeam.id, selectedBatters);
      }
      return;
    }

    const currentBatters = currentGame?.activeBatters ?? [];
    const battingEntries = currentGame?.battingEntries ?? [];

    // 1️⃣ Merge selectedBatters with current batters, ignoring dismissed entries
    const mergedBatters = [
      ...currentBatters.filter(
        (b) =>
          !b.retired && // 👈 ADD THIS
          selectedBatters.includes(b.playerId) &&
          !battingEntries.find(
            (e) =>
              e.playerId === b.playerId &&
              e.dismissal &&
              e.dismissal.kind !== "notOut",
          ),
      ),
      ...selectedBatters
        .filter(
          (id) =>
            !currentBatters.some((b) => b.playerId === id) &&
            !battingEntries.find(
              (e) =>
                e.playerId === id &&
                e.dismissal &&
                e.dismissal.kind !== "notOut",
            ),
        )
        .map((id) => ({
          playerId: id,
          runs: 0,
          balls: 0,
          retired: false,
        })),
    ];

    // 2️⃣ Update store only if changed
    if (
      mergedBatters.length !== currentBatters.length ||
      mergedBatters.some((b, i) => b.playerId !== currentBatters[i]?.playerId)
    ) {
      gameState.updateCurrentGame({
        ...gameState.currentGame,
        batters: mergedBatters,
      });
    }

    // 3️⃣ Ensure a valid strike
    const currentBattersIds = currentBatters.map((b) => b.playerId);
    const newStrikeId = currentBattersIds.includes(
      gameState.currentGame.currentStrikeId,
    )
      ? gameState.currentGame.currentStrikeId
      : mergedBatters[0]?.playerId;

    if (newStrikeId && gameState.currentGame.currentStrikeId !== newStrikeId) {
      setStrike(newStrikeId);
    }
  }, [hasHydrated, battingTeam?.id, selectedBatters.join(",")]); // ✅ include hasHydrated

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
                {activeBatters.map((p) => {
                  const strikeRate =
                    p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0";
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
                          {p.name} — {p.runs} ({p.balls}) SR: {strikeRate}
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
            pickerType="batter"
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
