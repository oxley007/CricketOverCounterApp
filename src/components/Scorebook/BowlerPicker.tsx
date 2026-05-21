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
                  <Text style={{ fontWeight: "700" }}>O:</Text> {stats.overs}{" "}
                  <Text style={{ fontWeight: "700" }}>M:</Text> {stats.maidens}{" "}
                  <Text style={{ fontWeight: "700" }}>R:</Text> {stats.runs}{" "}
                  <Text style={{ fontWeight: "700" }}>W:</Text> {stats.wickets}{" "}
                  <Text style={{ fontWeight: "700" }}>Econ:</Text>{" "}
                  {stats.economy} <Text style={{ fontWeight: "700" }}>WD:</Text>{" "}
                  {stats.wides} <Text style={{ fontWeight: "700" }}>NB:</Text>{" "}
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
          <Text>Select a bowling team first</Text>
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
                style={{ marginTop: 6 }}
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
  selectedBowlerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedBowlerText: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  bowlerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  activeBowler: {
    borderColor: "#12c2e9",
    borderWidth: 2,
    backgroundColor: "#e0f7ff",
    borderRadius: 8,
  },
  addBowlerButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#12c2e9",
    borderRadius: 8,
    alignItems: "center",
  },
  addBowlerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  statsText: {
    fontSize: 12,
    color: "#334155",
    marginTop: 2,
  },
  swapBowlerLink: {
    fontSize: 14,
    color: "#12c2e9",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
});
