// src/components/Scorebook/SelectPlayersModal.tsx
// Decoupled player selection modal: accepts only a list of players and selection mode.
// Callers are responsible for fetching/preparing the player list and optional footer UI.
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useTeamStore } from "../../state/teamStore";

import { MaterialIcons } from "@expo/vector-icons";
import BowlerScorecard from "./BowlerScorecard";
import Scorecard from "./Scorecard";

export type PlayerOption = { id: string; name: string };

export type SelectionMode = "single" | "multiple";

export type SelectPlayersModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Full list of players to choose from. Caller provides this (e.g. from team, from game). */
  players: PlayerOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  /** Single = pick one, multiple = pick up to maxSelection. */
  selectionMode: SelectionMode;
  /** Used only when selectionMode === "multiple". Default 2. */
  maxSelection?: number;
  /** Optional footer (e.g. "Add player" form). Rendered below the list; caller owns any team/store logic. */
  renderFooter?: () => ReactNode;
  pickerType?: "batter" | "bowler";
};

export default function SelectPlayersModal({
  visible,
  onClose,
  title,
  players,
  selectedIds: parentSelectedIds,
  onSelectionChange,
  selectionMode,
  maxSelection = 2,
  renderFooter,
  pickerType,
}: SelectPlayersModalProps) {
  const currentGame = useGameStore((s) => s.currentGame);
  const updatePlayerName = useTeamStore((s) => s.updatePlayerName);
  const fixtures = useFixtureStore((s) => s.fixtures);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const teamStore = useTeamStore();
  const myTeamId = currentGame?.battingTeamId;

  console.log(
    "Current Game Active Batters from store:",
    useGameStore.getState().currentGame?.activeBatters,
  );
  console.log(
    "Current Game Batting Entries:",
    useGameStore.getState().currentGame?.battingEntries,
  );
  console.log("Team Players:", players);
  const effectiveMax = selectionMode === "single" ? 1 : maxSelection;

  const [selectedIds, setSelectedIds] = useState<string[]>(
    parentSelectedIds ?? [],
  );

  useEffect(() => {
    if (visible) {
      setSelectedIds(parentSelectedIds ?? []);
    }
  }, [visible, parentSelectedIds, players]);

  const togglePlayer = (playerId: string) => {
    console.log("we are at least hitting!");
    console.log(currentGame?.activeBatters, "currentGame?.activeBatters check");

    setSelectedIds((prev) => {
      if (pickerType === "bowler") {
        // Single-selection mode for bowler
        const next = [playerId];
        //setSelectedIds(next);
        onSelectionChange(next);

        const { updateLastBowlerId } = useGameStore.getState();
        updateLastBowlerId(null);

        console.log(
          "🎯 SelectPlayerModal: Bowler selected → lastBowlerId cleared",
          currentGame?.lastBowlerId,
        );

        return;
      }

      let next: string[];
      const gameStore = useGameStore.getState();
      const game = gameStore.currentGame;
      if (!game || pickerType !== "batter") {
        console.log("Exiting togglePlayer early:", {
          gameExists: !!game,
          pickerType,
        });
        return prev;
      }

      // Get the current activeBatter
      const activeBatter = game.activeBatters.find(
        (b) => b.playerId === playerId,
      );

      // Find the player entry for this inning
      const playerEntry = currentGame?.battingEntries
        .filter((e) => e.playerId === playerId)
        .sort((a, b) => b.inningsNumber - a.inningsNumber)[0];

      const batterInningId = playerEntry?.entryId;

      console.log("we are at least hitting! 2! yay", {
        prev,
        activeBatter,
        playerId,
        currentGameActiveBatters: game.activeBatters,
        currentGameBattingEntries: game.battingEntries,
      });

      // Get all events from matchStore
      const matchStore =
        require("../../state/matchStore").useMatchStore.getState();
      const events = matchStore.events ?? [];

      // Only consider events for this batterInningId
      const batterEvents = events.filter(
        (ev) => ev.batterInningId === batterInningId && ev.countsAsBall,
      );
      //const ballsFaced = batterEvents.length;

      console.log(
        "Batter events for current inning:",
        batterEvents,
        "Balls faced:",
        ballsFaced,
      );

      console.log("we are at least hitting! 2", {
        prev,
        activeBatter,
        playerId,
        currentGameActiveBatters: game.activeBatters,
        currentGameBattingEntries: game.battingEntries,
      });

      // Check if player is already selected
      const isSelected = prev.some((b) => {
        if (typeof b === "string") return b === playerId;
        return b.playerId === playerId;
      });

      let nextSelected = [...selectedIds];
      let newActiveBatters = [...game.activeBatters];

      const entryId = playerEntry?.entryId ?? activeBatter?.batterInningId;
      const ballsFaced = entryId
        ? events.filter(
            (ev) => ev.batterInningId === entryId && ev.countsAsBall,
          ).length
        : 0;
      const runs = playerEntry?.runs ?? 0;

      if (isSelected && runs === 0 && ballsFaced === 0 && entryId) {
        // Remove from selectedIds
        nextSelected = nextSelected.filter((id) => id !== playerId);

        // Remove from activeBatters
        newActiveBatters = newActiveBatters.filter(
          (b) => b.playerId !== playerId,
        );

        // Remove the matching battingEntry for this playerId AND batterInningId
        const newBattingEntries = game.battingEntries.filter(
          (e) => !(e.playerId === playerId && e.entryId === entryId),
        );

        // Update game state
        gameStore.updateCurrentGame({
          ...game,
          activeBatters: newActiveBatters,
          battingEntries: newBattingEntries,
        });
      } else if (
        selectionMode === "single" &&
        game.activeBatters.length >= effectiveMax
      ) {
        // Single-select: replace existing batter
        const existing = game.activeBatters[0];
        const updatedBatters = game.activeBatters.filter(
          (b) => b.playerId !== existing.playerId,
        );

        gameStore.updateCurrentGame({
          ...game,
          activeBatters: updatedBatters,
        });

        next = [playerId];
      } else {
        // Multi-select: just add the new batter if not already selected
        if (!isSelected) {
          next = [...prev, playerId];

          const retiredBatter = game.activeRetired?.find(
            (b) => b.playerId === playerId,
          );
          if (retiredBatter) {
            matchStore.removeEventByPredicate?.((event: any) => {
              return (
                event.type === "wicket" &&
                event.kind === "retired" &&
                event.batterInningId === retiredBatter.batterInningId
              );
            });

            gameStore.updateCurrentGame({
              activeBatters: [...game.activeBatters, retiredBatter],
              activeRetired: game.activeRetired.filter(
                (b) => b.playerId !== playerId,
              ),
            });
          } else if (!activeBatter) {
            // Normal new batter flow
            const entryId = gameStore.addBatter(playerId);
            gameStore.updateCurrentGame({
              activeBatters: [
                ...game.activeBatters,
                { playerId, batterInningId: entryId },
              ],
            });
          }
        }
      }

      setSelectedIds(nextSelected);
      onSelectionChange(nextSelected);
      return next;
    });
  };

  // Notify parent whenever selection changes
  /*
  useEffect(() => {
    onSelectionChange(selectedIds);
    console.log("onSelectionChange called with:", selectedIds);
  }, [selectedIds]);
  */
  const filteredPlayers = players.filter((p) => showArchived || !p.archived);

  const startEditing = (player: PlayerOption) => {
    setEditingPlayerId(player.id);
    setEditedName(player.name);
  };

  const saveEdit = (playerId: string) => {
    if (!editedName.trim()) return;

    // ⚠️ You need teamId — pass it in as prop if not available here
    const teamId = currentGame?.battingTeamId || currentGame?.bowlingTeamId;
    if (!teamId) return;

    updatePlayerName(teamId, playerId, editedName.trim());
    setEditingPlayerId(null);
  };

  const archivePlayer = useTeamStore((s) => s.archivePlayer);

  // enrich filteredPlayers with teamId & myTeam
  const enrichedPlayers = filteredPlayers.map((p) => {
    const team = teamStore.teams.find((t) =>
      t.players.some((pl) => pl.id === p.id),
    );
    return {
      ...p,
      teamId: team?.id,
      myTeam: team?.id === myTeamId,
    };
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ScrollView style={styles.scroll}>
            {/* Only render the relevant scorecard */}
            {pickerType === "batter" && <Scorecard />}
            {pickerType === "bowler" && <BowlerScorecard />}
            <Text style={styles.title}>{title}</Text>

            {enrichedPlayers.length > 0 ? (
              enrichedPlayers.map((player) => {
                const matchStore =
                  require("../../state/matchStore").useMatchStore.getState();
                const currentEvents = matchStore.events ?? [];

                const playerEntry = currentGame?.battingEntries
                  .filter((e) => e.playerId === player.id)
                  .sort((a, b) => b.inningsNumber - a.inningsNumber)[0];

                const batterInningId = playerEntry?.entryId;

                console.log("Player ID:", player.id);
                console.log("Player entry:", playerEntry);
                console.log("BatterInningId:", batterInningId);
                console.log(
                  "Matching events:",
                  currentEvents.filter(
                    (ev) => ev.batterInningId === batterInningId,
                  ),
                );

                const currentBowlingStats = currentEvents;
                const retiredBatter = currentGame?.activeRetired?.find(
                  (b) => b.playerId === player.id,
                );

                const isRetired = !!retiredBatter;

                console.log("do i get to here?");
                console.log(
                  currentGame?.activeBatters,
                  "currentGame?.activeBatters check again.",
                );

                const selected = currentGame?.activeBatters?.some(
                  (b) => b.playerId === player.id,
                );

                //const selected = selectedIds.includes(player.id);
                //const selected = (selectedIds ?? []).includes(player.id);

                return (
                  <View
                    key={player.id}
                    style={[
                      styles.playerItem,
                      { backgroundColor: selected ? "#12c2e9" : "#f0f0f0" },
                    ]}
                  >
                    <View style={styles.playerRow}>
                      {editingPlayerId === player.id ? (
                        <>
                          <TextInput
                            value={editedName}
                            onChangeText={setEditedName}
                            style={styles.input}
                            autoFocus
                          />
                          <Pressable onPress={() => saveEdit(player.id)}>
                            <MaterialIcons
                              name="check"
                              size={22}
                              color="green"
                            />
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable
                            style={{ flex: 1 }}
                            onPress={() => togglePlayer(player.id)}
                          >
                            <Text style={{ color: selected ? "#fff" : "#000" }}>
                              {player.name}
                              {isRetired
                                ? " — retired (tap to continue innings)"
                                : ""}
                            </Text>
                          </Pressable>

                          {/* ✅ Stats button now works */}

                          {player.myTeam && (
                            <Pressable
                              style={{ marginLeft: 8 }}
                              onPress={() => {
                                useGameStore
                                  .getState()
                                  .openStatsModal(player.id);
                                onClose(); // close SelectPlayersModal
                              }}
                            >
                              <MaterialIcons
                                name="bar-chart"
                                size={30}
                                color="red"
                              />
                            </Pressable>
                          )}

                          <Pressable onPress={() => startEditing(player)}>
                            <MaterialIcons
                              name="edit"
                              size={20}
                              color="#64748b"
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              const teamId =
                                currentGame?.battingTeamId ||
                                currentGame?.bowlingTeamId;
                              if (!teamId) return;

                              if (!player.archived) {
                                Alert.alert(
                                  "Archive Player",
                                  `Are you sure you want to archive ${player.name}?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Yes, Archive",
                                      style: "destructive",
                                      onPress: () =>
                                        archivePlayer(teamId, player.id, true),
                                    },
                                  ],
                                );
                              } else {
                                archivePlayer(teamId, player.id, false);
                              }
                            }}
                          >
                            <MaterialIcons
                              name={player.archived ? "restore" : "delete"}
                              size={20}
                              color={player.archived ? "orange" : "#64748b"}
                            />
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noPlayers}>
                <Text style={styles.noPlayersText}>
                  No players in this list.
                </Text>
              </View>
            )}
            <Pressable
              style={{ marginVertical: 12, alignSelf: "center" }}
              onPress={() => setShowArchived((prev) => !prev)}
            >
              <Text style={{ color: "#12c2e9", fontWeight: "600" }}>
                {showArchived
                  ? "Hide Archived Players"
                  : "Show Archived Players"}
              </Text>
            </Pressable>
          </ScrollView>

          {renderFooter?.()}

          <Pressable
            onPress={() => {
              // Notify parent if needed
              //onSelectionChange(selectedIds);
              // Close modal
              onClose();
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  scroll: { flex: 1 },
  playerItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  noPlayers: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  noPlayersText: { color: "#64748b", fontSize: 15 },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#12c2e9",
    borderRadius: 12,
    alignSelf: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "600" },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
});
