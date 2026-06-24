// src/components/Scorebook/BattersPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { savePlayer } from "../../services/firestoreService";
import { useFixtureStore } from "../../state/fixtureStore";
import { calculateBatterStats } from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import type { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";
import { useIsLiveViewer } from "@/src/hooks/useIsLiveViewer";
import { LinearGradient } from "expo-linear-gradient";

interface BattersPickerProps {
  battingTeam: Team | null;
  selectedBatters: string[]; // Still accepted for interface compatibility if parent uses it
  onSelectionChange: (ids: string[]) => void;
}

export default function BattersPicker({
  battingTeam,
  selectedBatters: parentSelectedBatters,
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
  const isLiveViewer = useIsLiveViewer();

  const handleCloseModal = () => setShowModal(false);

  // 🌟 FIX: Derive active selections directly from the single source of truth
  const activeBatterIds = (currentGame?.activeBatters ?? []).map(
    (b) => b.playerId,
  );

  const shouldShowChangeBatters = (() => {
    if (activeBatterIds.length === 0) return false;
    const activeBattersObjects = currentGame?.activeBatters ?? [];
    if (activeBattersObjects.length < 2) return true;

    const stats = activeBattersObjects.map(({ playerId, batterInningId }) =>
      calculateBatterStats(matchEvents, playerId, batterInningId),
    );

    if (
      stats.length === 2 &&
      stats.every((b) => b.runs === 0 && b.balls === 0)
    ) {
      return true;
    }

    if (stats.some((b) => b.runs === 0 && b.balls === 0)) {
      return true;
    }

    return false;
  })();

  const battingTeamPlayers =
    battingTeam?.players.map((p) => ({
      ...p,
      teamId: battingTeam.id,
    })) ?? [];

  // Derive active batters for display
  const activeBatters = (currentGame?.activeBatters ?? [])
    .map(({ playerId, batterInningId }) => {
      const player = battingTeamPlayers.find((p) => p.id === playerId);
      if (!player) return null;

      const { runs, balls } = calculateBatterStats(
        matchEvents,
        playerId,
        batterInningId,
      );

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

  const currentStrikeId = currentGame?.currentStrikeId;
  const strikerObject =
    activeBatters.find((b) => b.id === currentStrikeId) || activeBatters[0];
  const nonStrikerObject =
    activeBatters.find((b) => b.id !== strikerObject?.id) || activeBatters[1];

  const striker = {
    name: strikerObject?.name ?? "No Batter",
    runs: strikerObject?.runs ?? 0,
    balls: strikerObject?.balls ?? 0,
    strikeRate: strikerObject?.balls
      ? ((strikerObject.runs / strikerObject.balls) * 100).toFixed(1)
      : "0.0",
  };

  const nonStriker = {
    name: nonStrikerObject?.name ?? "No Batter",
    runs: nonStrikerObject?.runs ?? 0,
    balls: nonStrikerObject?.balls ?? 0,
    strikeRate: nonStrikerObject?.balls
      ? ((nonStrikerObject.runs / nonStrikerObject.balls) * 100).toFixed(1)
      : "0.0",
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!battingTeam) return;

    const gameState = useGameStore.getState();

    if (!gameState.currentGame) {
      if (activeBatterIds.length > 0) {
        const cfg = gameState.gameConfig;
        const bowlingTeamId =
          cfg && battingTeam.id === cfg.yourTeam.id
            ? cfg.oppositionTeam.id
            : cfg?.yourTeam.id;
        if (bowlingTeamId) {
          startGame(battingTeam.id, bowlingTeamId, activeBatterIds);
        }
      }
      return;
    }

    const currentBatters = currentGame?.activeBatters ?? [];
    const battingEntries = currentGame?.battingEntries ?? [];

    const mergedBatters = [
      ...currentBatters.filter(
        (b) =>
          !b.retired &&
          activeBatterIds.includes(b.playerId) &&
          !battingEntries.find(
            (e) =>
              e.playerId === b.playerId &&
              e.dismissal &&
              e.dismissal.kind !== "notOut",
          ),
      ),
      ...activeBatterIds
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

    const strike = gameState.currentGame.currentStrikeId;
    const currentBattersIds = currentBatters.map((b) => b.playerId);
    const newStrikeId =
      strike != null && strike !== "" && currentBattersIds.includes(strike)
        ? strike
        : mergedBatters[0]?.playerId;

    if (
      newStrikeId &&
      newStrikeId !== "" &&
      gameState.currentGame.currentStrikeId !== newStrikeId
    ) {
      setStrike(newStrikeId);
    }
  }, [hasHydrated, battingTeam?.id, activeBatterIds.join(",")]);

  const handleSavePlayer = async (teamId: string, player: any) => {
    try {
      await savePlayer(teamId, player);
    } catch (err) {
      console.error("❌ Error saving player:", err);
      Alert.alert("Error", "Failed to save player. Try again.");
    }
  };

  // Safe callback wrapper that automatically forwards updates back up
  const handleSelectionChange = (ids: string[]) => {
    onSelectionChange(ids);
    if (ids.length === 2) {
      setShowModal(false);
    }
  };

  return (
    <>
      {battingTeam && (
        <>
          <View style={{ width: "100%" }}>
            {activeBatterIds.length > 0 ? (
              <View style={styles.grid}>
                {/* 1. ACTIVE BATTER CARD (STRIKER) */}
                <Pressable
                  style={({ pressed }) => [
                    styles.glassCard,
                    styles.strikerNeonCard,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => {
                    if (isLiveViewer || !strikerObject?.id) return;
                    if (
                      currentGame?.activeBatters?.some(
                        (b) => b.playerId === strikerObject.id,
                      )
                    ) {
                      setStrike(strikerObject.id);
                    }
                  }}
                >
                  <View style={styles.infoColumn}>
                    <Text style={styles.strikerNameText}>{striker.name}</Text>
                    <View style={styles.strikerBadge}>
                      <Text style={styles.strikerBadgeText}>Striker</Text>
                    </View>
                  </View>

                  <View style={styles.statsColumn}>
                    <Text style={styles.scoreText}>
                      {striker.runs}{" "}
                      <Text style={styles.ballsText}>({striker.balls})</Text>
                    </Text>
                    <Text style={styles.strikeRateText}>
                      SR: {striker.strikeRate}
                    </Text>
                  </View>
                </Pressable>

                {/* 2. NON-STRIKER CARD */}
                <Pressable
                  style={({ pressed }) => [
                    styles.glassCard,
                    styles.nonStrikerCard,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => {
                    if (isLiveViewer || !nonStrikerObject?.id) return;
                    if (
                      currentGame?.activeBatters?.some(
                        (b) => b.playerId === nonStrikerObject.id,
                      )
                    ) {
                      setStrike(nonStrikerObject.id);
                    }
                  }}
                >
                  <View style={styles.infoColumn}>
                    <Text style={styles.nonStrikerNameText}>
                      {nonStriker.name}
                    </Text>
                    <View style={styles.nonStrikerBadge}>
                      <Text style={styles.nonStrikerBadgeText}>
                        Non-Striker
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsColumn}>
                    <Text style={styles.scoreText}>
                      {nonStriker.runs}{" "}
                      <Text style={styles.ballsText}>({nonStriker.balls})</Text>
                    </Text>
                    <Text style={styles.strikeRateText}>
                      SR: {nonStriker.strikeRate}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <View style={styles.glassCardBase}>
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  colors={["#7fdaff", "#ddb7ff", "#f8ca11"]}
                  style={styles.topGradientBar}
                />

                <View style={styles.contentContainer}>
                  <Text style={styles.title}>
                    Select opening batters to start scoring
                  </Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => !isLiveViewer && setShowModal(true)}
                  >
                    <Text style={styles.primaryButtonText}>Select Batters</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {shouldShowChangeBatters && (
              <Pressable
                style={[
                  styles.primaryButton,
                  { marginTop: 12, marginBottom: 12 },
                ]}
                onPress={() => !isLiveViewer && setShowModal(true)}
              >
                <Text style={styles.primaryButtonText}>Change Batters</Text>
              </Pressable>
            )}
          </View>

          <SelectPlayersModal
            visible={showModal}
            onClose={handleCloseModal}
            title={`Select Batters for ${battingTeam?.name ?? ""}`}
            players={battingTeamPlayers}
            // 🌟 FIX: Map absolute global game engine state so dismissed batters are never left selected
            selectedIds={
              currentGame?.activeBatters?.map((b) => b.playerId) ?? []
            }
            onSelectionChange={onSelectionChange}
            selectionMode="multiple"
            maxSelection={2}
            pickerType="batter"
            renderFooter={() => (
              <View style={{ paddingBottom: 20 }}>
                <AddPlayerFooter
                  teamId={selectedBattingTeamId!}
                  onAdded={async (name) => {
                    const player = addPlayerToTeam(
                      selectedBattingTeamId!,
                      name,
                    );
                    if (player) {
                      await handleSavePlayer(selectedBattingTeamId!, player);
                    }
                  }}
                />
              </View>
            )}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addBatters: {
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 5,
    borderLeftColor: "#ffd54f",
  },
  addBattersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  addBowlerButton: {
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  addBowlerButtonText: { color: "#0e9cb9", fontWeight: "700", fontSize: 16 },
  glassCardBase: {
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
  glassCard: {
    backgroundColor: "rgba(45, 52, 73, 0.7)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  topGradientBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  contentContainer: { padding: 24 },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "700",
    color: "#dae2fd",
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
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
  grid: { width: "100%", flexDirection: "column", gap: 12 },
  strikerNeonCard: {
    borderWidth: 1,
    borderColor: "#7fdaff",
    shadowColor: "#7fdaff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  strikerNameText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: "#7fdaff",
  },
  strikerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(127, 218, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strikerBadgeText: {
    fontFamily: "Geist",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#7fdaff",
  },
  nonStrikerCard: {
    opacity: 0.7,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(218, 226, 253, 0.2)",
  },
  nonStrikerNameText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: "#dae2fd",
  },
  nonStrikerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2d3449",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nonStrikerBadgeText: {
    fontFamily: "Geist",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#bcc8cf",
  },
  infoColumn: { flexDirection: "column", gap: 4, alignItems: "flex-start" },
  statsColumn: { flexDirection: "column", alignItems: "flex-end" },
  scoreText: {
    fontFamily: "Geist",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "500",
    color: "#dae2fd",
  },
  ballsText: {
    fontFamily: "Hanken Grotesk",
    fontSize: 16,
    color: "#bcc8cf",
    fontWeight: "400",
  },
  strikeRateText: {
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    color: "#bcc8cf",
  },
});
