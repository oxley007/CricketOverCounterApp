// src/components/Scorebook/BowlerPicker.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
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
  const currentBowlerId = useGameStore((s) => s.currentGame?.currentBowlerId);

  const currentBowler = bowlingTeamPlayers.find(
    (p) => p.id === currentBowlerId,
  );

  const getBowlerStats = useCallback(
    (playerId: string) => {
      const bowlerEvents = events.filter((e) => e.bowlerId === playerId);

      const balls = bowlerEvents.filter((e) => e.countsAsBall).length;
      const runs = bowlerEvents.reduce((sum, e) => {
        const batRuns = e.runBreakdown?.bat || 0;

        const isBowlerExtra =
          e.extraType === "wide" || e.extraType === "noBall";

        const extraRuns = isBowlerExtra ? e.runBreakdown?.extras || 0 : 0;

        return sum + batRuns + extraRuns;
      }, 0);
      const wickets = bowlerEvents.filter((e) => e.type === "wicket").length;
      const wides = bowlerEvents.filter((e) => e.extraType === "wide").length;
      const noBalls = bowlerEvents.filter(
        (e) => e.extraType === "noBall",
      ).length;

      const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

      // Maidens
      let maidens = 0,
        ballInOver = 0,
        runsInOver = 0;
      bowlerEvents.forEach((e) => {
        if (e.countsAsBall) {
          runsInOver += e.runs || 0;
          ballInOver++;
          if (ballInOver === 6) {
            if (runsInOver === 0) maidens++;
            ballInOver = 0;
            runsInOver = 0;
          }
        }
      });

      const oversDecimal = balls / 6;
      const economy =
        oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : "0.00";

      return { overs, maidens, runs, wickets, economy, wides, noBalls };
    },
    [events], // ✅ only re-create if events change
  );

  useEffect(() => {
    if (ballCount > 0 && ballCount % 6 === 0) {
      console.log("🏏 End of over detected");
      console.log("ballCount:", ballCount);
      console.log("currentBowler:", currentBowler?.name);

      if (currentBowler) {
        const stats = getBowlerStats(currentBowler.id);
        console.log("Last bowler stats:", stats);

        setLastBowlerStats({
          name: currentBowler.name,
          stats,
        });
      } else {
        console.log("No current bowler found at end of over!");
      }
    }
  }, [ballCount, currentBowler, getBowlerStats]);

  useEffect(() => {
    if (currentBowler) setLastBowlerStats(null);
  }, [currentBowler]);

  const ballsInCurrentOver = ballCount % 6;
  const isOverComplete = ballsInCurrentOver === 0 && ballCount > 0;

  const player = currentBowler;

  // ======= FUNCTIONS =======

  const handleSelectBowler = (playerId: string) => {
    // Store last bowler info
    if (currentBowler && currentBowler.id !== playerId) {
      setLastBowlerStats({
        name: currentBowler.name,
        stats: getBowlerStats(currentBowler.id),
      });
    }

    // Update store
    setCurrentBowler(playerId);

    onSelectionChange(playerId); // notify parent
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

  const showLastBowlerUI =
    lastBowlerStats && (!currentBowler || isOverComplete);

  // ======= RENDER =======
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.selectedBowlers}>
        {showLastBowlerUI ? (
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
        ) : currentBowler && player && stats ? (
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
            if (ids.length) {
              handleSelectBowler(ids[0]); // only respond to user tap
            }
          }}
          selectionMode="single"
          pickerType="bowler"
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
