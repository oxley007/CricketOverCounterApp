// src/components/Scorebook/BowlerPicker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { savePlayer } from "../../services/firestoreService";
import {
  calculateBowlerStats,
  type BowlerStats,
} from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import type { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";
import { useIsLiveViewer } from "@/src/hooks/useIsLiveViewer";

interface BowlerPickerProps {
  bowlingTeam: Team | null;
  selectedBowlerId: string | null;
  onSelectionChange: (id: string | null) => void;
}

export default function BowlerPicker({
  bowlingTeam,
  selectedBowlerId,
  onSelectionChange,
}: BowlerPickerProps) {
  // ======= STATE =======
  const [showModal, setShowModal] = useState(false);
  const [lastBowlerStats, setLastBowlerStats] = useState<{
    name: string;
    stats: BowlerStats;
  } | null>(null);

  // ======= STORES =======
  const currentGame = useGameStore((s) => s.currentGame);
  const setCurrentBowler = useGameStore((s) => s.setCurrentBowler);

  const events = useMatchStore((s) => s.events);
  const addPlayerToTeam = useTeamStore((s) => s.addPlayer);

  const [lastOverBallCount, setLastOverBallCount] = useState(0);

  //const bowlingTeamPlayers = bowlingTeam?.players ?? [];
  const bowlingTeamPlayers =
    bowlingTeam?.players.map((p) => ({
      ...p,
      teamId: bowlingTeam.id,
    })) ?? [];

  const currentBowlerId = useGameStore((s) => s.currentGame?.currentBowlerId);

  const currentBowler = bowlingTeamPlayers.find(
    (p) => p.id === currentBowlerId,
  );

  // ======= BALL COUNT =======
  const ballCount = useMemo(() => {
    return events.reduce((count, e) => count + (e.countsAsBall ? 1 : 0), 0);
  }, [events]);

  const ballsInCurrentOver = ballCount % 6;
  const isOverComplete = ballsInCurrentOver === 0 && ballCount > 0;

  const isLiveViewer = useIsLiveViewer();

  // ======= CURRENT BOWLER STATS =======
  const stats = useMemo(() => {
    if (!currentBowler) return null;
    return calculateBowlerStats(events, currentBowler.id);
  }, [events, currentBowler]);

  // ======= END OF OVER DETECTION =======
  useEffect(() => {
    if (!currentBowler) return;

    if (
      ballCount > 0 &&
      ballCount % 6 === 0 &&
      ballCount !== lastOverBallCount
    ) {
      const overStats = calculateBowlerStats(events, currentBowler.id);

      setLastBowlerStats({
        name: currentBowler.name,
        stats: overStats,
      });

      setLastOverBallCount(ballCount);
    }
  }, [ballCount, currentBowler, events, lastOverBallCount]);

  // ======= RESET LAST BOWLER WHEN NEW ONE SELECTED =======
  /*
  useEffect(() => {
    if (currentBowler) {
      setLastBowlerStats(null);
    }
  }, [currentBowler]);
  */

  // ======= FUNCTIONS =======
  const handleSelectBowler = (playerId: string) => {
    // Store last bowler info before switching
    if (currentBowler && currentBowler.id !== playerId) {
      const previousStats = calculateBowlerStats(events, currentBowler.id);

      setLastBowlerStats({
        name: currentBowler.name,
        stats: previousStats,
      });
    }

    setCurrentBowler(playerId);
    onSelectionChange(playerId);
    setShowModal(false);
  };

  if (!currentGame) {
    return (
      <View style={styles.selectedBowlers}>
        <Text>No active game</Text>
      </View>
    );
  }

  const shouldShowChangeBowler = ballCount % 6 === 0 || ballCount === 0;

  //const showLastBowlerUI = lastBowlerStats && !currentBowler;

  const isOverInProgress = ballsInCurrentOver > 0 && ballsInCurrentOver < 6;

  const handleSavePlayer = async (teamId: string, player: any) => {
    try {
      await savePlayer(teamId, player);
    } catch (err) {
      console.error("❌ Error saving player:", err);
      Alert.alert("Error", "Failed to save player. Try again.");
    }
  };

  // ======= RENDER =======
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.selectedBowlers}>
        {currentBowler && stats ? (
          <View style={[styles.selectedBowlerItem, styles.activeBowler]}>
            <View style={styles.bowlerRow}>
              <View style={{ flexDirection: "column" }}>
                <Text style={styles.selectedBowlerText}>
                  {currentBowler.name}
                </Text>
                <Text style={styles.statsText}>
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    O:
                  </Text>{" "}
                  {stats.overs}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    M:
                  </Text>{" "}
                  {stats.maidens}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    R:
                  </Text>{" "}
                  {stats.runs}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    W:
                  </Text>{" "}
                  {stats.wickets}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    Econ:
                  </Text>{" "}
                  {stats.economy}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    WD:
                  </Text>{" "}
                  {stats.wides}{" "}
                  <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                    NB:
                  </Text>{" "}
                  {stats.noBalls}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {!isLiveViewer && (
              <Text style={styles.selectedText}>Add a bowler to start</Text>
            )}
          </>
        )}

        {!bowlingTeam && !isLiveViewer && (
          <Text style={styles.selectedText}>Select a bowling team first</Text>
        )}
        {!isLiveViewer && (
          <View style={{ marginTop: 0 }}>
            {shouldShowChangeBowler && (
              <Pressable
                style={styles.addBowlerButton}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.addBowlerButtonText}>
                  {currentBowler ? "Change Bowler" : "Add Bowler"}
                </Text>
              </Pressable>
            )}

            {currentBowler && isOverInProgress && (
              <Pressable
                onPress={() => setShowModal(true)}
                style={{ marginTop: 8, alignItems: "center" }}
              >
                <Text style={styles.swapBowlerLink}>Swap Bowler</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {bowlingTeam && (
        <SelectPlayersModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          title={`Select Bowler for ${bowlingTeam.name}`}
          players={bowlingTeamPlayers}
          selectedIds={currentBowler ? [currentBowler.id] : []}
          onSelectionChange={(ids) => {
            if (ids.length) {
              handleSelectBowler(ids[0]);
            }
          }}
          selectionMode="single"
          pickerType="bowler"
          renderFooter={() => (
            <View style={{ paddingBottom: 20 }}>
              <AddPlayerFooter
                teamId={bowlingTeam.id}
                onAdded={async (name) => {
                  const player = addPlayerToTeam(bowlingTeam.id, name);
                  if (player) await handleSavePlayer(bowlingTeam.id, player);
                }}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectedBowlers: {
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Matches dark cyan dashboard theme
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 5,
    borderLeftColor: "#ffd54f", // Left indicator badge shifted to high-contrast amber
  },
  selectedBowlerItem: {
    paddingVertical: 4,
  },
  selectedBowlerText: {
    fontSize: 18, // Enlarged slightly to stand out as a main header
    color: "#ffffff", // Pure white typography
    fontWeight: "700",
  },
  bowlerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  activeBowler: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Premium glass highlight (matches Change Team button)
    borderRadius: 8,
  },
  addBowlerButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff", // Pure white contrast action button
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  addBowlerButtonText: {
    color: "#0e9cb9", // Links color back to theme backdrop
    fontWeight: "700",
    fontSize: 16,
  },
  statsText: {
    fontSize: 13,
    color: "#b2ebf2", // Crisp, secondary light-teal shade for live metrics reading
    marginTop: 4,
    lineHeight: 18,
  },
  swapBowlerLink: {
    fontSize: 14,
    color: "#b2ebf2", // Subdued but clear links text color
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e0f7fa", // High-contrast soft cyan for system hint labels
    textAlign: "center",
    marginVertical: 6,
  },
});
