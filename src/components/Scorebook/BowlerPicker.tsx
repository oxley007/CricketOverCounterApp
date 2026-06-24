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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

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
  const [isSwapFlow, setIsSwapFlow] = useState(false);
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
      <View style={styles.glassCard}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          // Dynamically changes colors array based on active bowler state
          colors={
            currentBowler && stats
              ? ["transparent", "transparent", "transparent"] // Active State: Solid dark cyan mix
              : ["#7fdaff", "#ddb7ff", "#f8ca11"] // Empty State: Vibrant brand gradient
          }
          style={styles.topGradientBar}
        />

        {currentBowler && stats ? (
          <View style={[styles.selectedBowlerItem, styles.activeBowler]}>
            {/* Header Row: Bowler Avatar & Name */}
            <View style={styles.bowlerHeaderRow}>
              <View style={styles.avatarCircle}>
                <MaterialIcons name="circle" size={14} color="#ddb7ff" />
              </View>
              <Text style={styles.selectedBowlerText}>
                {currentBowler.name}
              </Text>
            </View>

            {/* Metrics Grid Row: Replaces the old stats text wall */}
            <View style={styles.metricsGrid}>
              {/* Overs (O) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>O</Text>
                <Text style={[styles.metricValue, styles.primaryTextHighlight]}>
                  {stats.overs}
                </Text>
              </View>

              {/* Maidens (M) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>M</Text>
                <Text style={styles.metricValue}>{stats.maidens}</Text>
              </View>

              {/* Runs (R) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>R</Text>
                <Text style={styles.metricValue}>{stats.runs}</Text>
              </View>

              {/* Wickets (W) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>W</Text>
                <Text
                  style={[styles.metricValue, styles.secondaryTextHighlight]}
                >
                  {stats.wickets}
                </Text>
              </View>

              {/* Economy (Econ) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>ECON</Text>
                <Text style={styles.metricValue}>{stats.economy}</Text>
              </View>

              {/* Wides (WD) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>WD</Text>
                <Text style={styles.metricValue}>{stats.wides}</Text>
              </View>

              {/* No Balls (NB) */}
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>NB</Text>
                <Text style={styles.metricValue}>{stats.noBalls}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {!isLiveViewer && (
              <View style={styles.contentContainerStart}>
                <Text style={styles.title}>Add a bowler to start</Text>
              </View>
            )}
          </>
        )}
        <View style={styles.contentContainer}>
          {!bowlingTeam && !isLiveViewer && (
            <Text style={styles.selectedText}>Select a bowling team first</Text>
          )}
          {!isLiveViewer && (
            <View style={{ marginTop: 0 }}>
              {shouldShowChangeBowler && (
                <View style={{ marginTop: 0 }}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setIsSwapFlow(false); // 🌟 Fresh over/add over means clear active selector highlight
                      setShowModal(true);
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {currentBowler ? "Change Bowler" : "Add Bowler"}
                    </Text>
                  </Pressable>

                  {currentBowler && isOverInProgress && (
                    <Pressable
                      onPress={() => {
                        setIsSwapFlow(true); // 🌟 Mid-over injury swap means keep existing selection checked
                        setShowModal(true);
                      }}
                      style={{ marginTop: 12, alignItems: "center" }}
                    >
                      <Text style={styles.swapBowlerLink}>Swap Bowler</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Clean up duplicate rendering conditions safely */}
              {!shouldShowChangeBowler && currentBowler && isOverInProgress && (
                <Pressable
                  onPress={() => {
                    setIsSwapFlow(true); // 🌟 Mid-over injury swap means keep existing selection checked
                    setShowModal(true);
                  }}
                  style={{ marginTop: 8, alignItems: "center" }}
                >
                  <Text style={styles.swapBowlerLink}>Swap Bowler</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {bowlingTeam && (
        <SelectPlayersModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          title={`Select Bowler for ${bowlingTeam.name}`}
          players={bowlingTeamPlayers}
          // 🌟 FIX: Only display current bowler checked if we explicitly initiated a swap action flow
          selectedIds={isSwapFlow && currentBowler ? [currentBowler.id] : []}
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
    backgroundColor: "#transparent", // Matches dark cyan dashboard theme
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
    paddingVertical: 20,
    paddingHorizontal: 10,
    paddingBottom: 0,
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
    //backgroundColor: "rgba(255, 255, 255, 0.15)", // Premium glass highlight (matches Change Team button)
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
  // Append or ensure these rules exist inside your StyleSheet.create object:
  contentContainer: {
    padding: 24, // Universal card internal content framing buffer
  },
  contentContainerStart: {
    paddingTop: 24,
    paddingLeft: 24,
    paddingRight: 24, // Universal card internal content framing buffer
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "700",
    color: "#dae2fd", // Upgraded to text-on-surface grey
    //marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 12,
    backgroundColor: "rgba(0, 194, 243, 0.15)", // primary-container translucent blend
    borderWidth: 1.5,
    borderColor: "#00c2f3", // primary-container layout ring accent boundary
    borderRadius: 12, // rounded-xl uniform standard tokens
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  primaryButtonText: {
    fontFamily: "Plus Jakarta Sans",
    color: "#7fdaff", // text-primary typography punch highlighting
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bowlerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3 (12px)
    marginBottom: 12, // space-y-3 vertical spacing gap
  },
  avatarCircle: {
    width: 40, // w-10 (40px)
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6f00be", // bg-secondary-container
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBowlerText: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    lineHeight: 28,
    fontWeight: "700", // font-bold
    color: "#dae2fd", // text-on-surface
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows the columns to flow smoothly into a second line
    gap: 8, // gap-2 (8px spacing inside grid)
    paddingTop: 8, // pt-2
    borderTopWidth: 1, // border-t
    borderTopColor: "rgba(61, 73, 78, 0.2)", // border-outline-variant/20
  },
  metricColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: "12%", // Dictates a clean 4 to 7 item inline auto column width
    flexGrow: 1,
  },
  metricLabel: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 10, // text-[10px]
    fontWeight: "600",
    color: "#bcc8cf", // text-on-surface-variant
    textTransform: "uppercase",
    letterSpacing: 0.5, // tracking-wider
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 16, // text-base
    fontWeight: "500",
    color: "#dae2fd", // text-on-surface default
  },
  primaryTextHighlight: {
    color: "#7fdaff", // text-primary accent color for active overs metric
  },
  secondaryTextHighlight: {
    color: "#ddb7ff", // text-secondary accent color for wickets column
    fontWeight: "700", // font-bold
  },
});
