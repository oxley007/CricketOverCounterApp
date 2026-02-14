// src/components/Scorebook/BowlerPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import type { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";

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
  // ======= HOOKS (always run) =======
  const [showModal, setShowModal] = useState(false);
  const [lastBowlerStats, setLastBowlerStats] = useState<{
    name: string;
    stats: any;
  } | null>(null);

  const currentGame = useGameStore((s) => s.currentGame);
  const setCurrentBowler = useGameStore((s) => s.setCurrentBowler);
  const addBowler = useGameStore((s) => s.addBowler);

  const events = useMatchStore((s) => s.events);

  const ballCount = events.reduce(
    (count, e) => count + (e.countsAsBall ? 1 : 0),
    0,
  );

  const addPlayerToTeam = useTeamStore((s) => s.addPlayer);

  const bowlingTeamPlayers = bowlingTeam?.players ?? [];

  // Find currently selected bowler
  const currentBowler = bowlingTeamPlayers.find(
    (p) => p.id === selectedBowlerId,
  );

  useEffect(() => {
    // only run if there is a current bowler
    if (!currentBowler) return;

    // Check if over is complete
    if (ballCount > 0 && ballCount % 6 === 0) {
      // Capture last bowler info
      setLastBowlerStats({
        name: currentBowler.name,
        stats: getBowlerStats(currentBowler.id),
      });

      // Reset selection so next bowler can be chosen
      onSelectionChange(null);
    }
  }, [ballCount, currentBowler]);

  const ballsInCurrentOver = ballCount % 6;
  const isOverComplete = ballsInCurrentOver === 0 && ballCount > 0;

  const player = currentBowler;

  // ======= FUNCTIONS =======
  const getBowlerStats = (playerId: string) => {
    const bowlerEvents = events.filter((e) => e.bowlerId === playerId);

    let balls = 0,
      runs = 0,
      wickets = 0,
      wides = 0,
      noBalls = 0;
    bowlerEvents.forEach((e) => {
      if (e.countsAsBall) balls += 1;
      runs += e.runs || 0;
      if (e.type === "wicket") wickets += 1;
      if (e.extraType === "wide") wides += 1;
      if (e.extraType === "noBall") noBalls += 1;
    });

    const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

    let maidens = 0,
      overRuns = 0,
      ballInOver = 0;
    bowlerEvents.forEach((e) => {
      if (e.countsAsBall) {
        ballInOver += 1;
        overRuns += e.runs || 0;
        if (ballInOver === 6) {
          if (overRuns === 0) maidens += 1;
          ballInOver = 0;
          overRuns = 0;
        }
      }
    });

    const oversDecimal = balls / 6;
    const economy =
      oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : "0.00";

    return { overs, maidens, runs, wickets, economy, wides, noBalls };
  };

  const handleSelectBowler = (playerId: string) => {
    // Before changing the current bowler, store the old one
    if (currentBowler) {
      setLastBowlerStats({
        name: currentBowler.name,
        stats: getBowlerStats(currentBowler.id),
      });
    }

    onSelectionChange(playerId); // Update parent state
    setShowModal(false);
  };

  const stats = currentBowler ? getBowlerStats(currentBowler.id) : null;

  if (!currentGame) {
    return (
      <View style={styles.selectedBowlers}>
        <Text>No active game</Text>
      </View>
    );
  }

  const shouldShowChangeBowler = (() => {
    // legal balls = 0 or 6
    return ballCount % 6 === 0 || ballCount === 0;
  })();

  // ======= RENDER =======
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.selectedBowlers}>
        {currentBowler && player && stats ? (
          <View style={[styles.selectedBowlerItem, styles.activeBowler]}>
            <View style={styles.bowlerRow}>
              <View style={{ flexDirection: "column" }}>
                <Text style={styles.selectedBowlerText}>{player.name}</Text>
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
        ) : lastBowlerStats ? (
          <View style={styles.selectedBowlerItem}>
            <View style={styles.bowlerRow}>
              <View style={{ flexDirection: "column" }}>
                <Text style={styles.selectedBowlerText}>
                  Last bowler: {lastBowlerStats.name}
                </Text>
                <Text style={styles.statsText}>
                  <Text style={{ fontWeight: "700" }}>O:</Text>{" "}
                  {lastBowlerStats.stats.overs}{" "}
                  <Text style={{ fontWeight: "700" }}>M:</Text>{" "}
                  {lastBowlerStats.stats.maidens}{" "}
                  <Text style={{ fontWeight: "700" }}>R:</Text>{" "}
                  {lastBowlerStats.stats.runs}{" "}
                  <Text style={{ fontWeight: "700" }}>W:</Text>{" "}
                  {lastBowlerStats.stats.wickets}{" "}
                  <Text style={{ fontWeight: "700" }}>Econ:</Text>{" "}
                  {lastBowlerStats.stats.economy}{" "}
                  <Text style={{ fontWeight: "700" }}>WD:</Text>{" "}
                  {lastBowlerStats.stats.wides}{" "}
                  <Text style={{ fontWeight: "700" }}>NB:</Text>{" "}
                  {lastBowlerStats.stats.noBalls}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text>Add a bowler to start</Text>
        )}

        {!bowlingTeam && <Text>Select a bowling team first</Text>}

        <View style={{ marginTop: 12 }}>
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
        </View>
      </View>

      {bowlingTeam && (
        <SelectPlayersModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          title={`Select Bowler for ${bowlingTeam.name}`}
          players={bowlingTeamPlayers}
          selectedIds={currentBowler ? [currentBowler.id] : []} // This should now be correct
          onSelectionChange={(ids) => {
            if (ids.length) handleSelectBowler(ids[0]);
          }}
          selectionMode="single"
          renderFooter={() => (
            <AddPlayerFooter
              teamId={bowlingTeam.id}
              onAdded={(name) => addPlayerToTeam(bowlingTeam.id, name)}
            />
          )}
        />
      )}
    </View>
  );
}

// ======= STYLES =======
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
  bowlIcon: {
    width: 20,
    textAlign: "center",
    marginRight: 8,
    fontWeight: "700",
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
  addBowlerButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  statsText: { fontSize: 14, color: "#334155", marginTop: 2 },
  bottomButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
