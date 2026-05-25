// src/components/Scorebook/SelectPlayersModal.tsx
// Decoupled player selection modal: accepts only a list of players and selection mode.
// Callers are responsible for fetching/preparing the player list and optional footer UI.
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useTeamStore } from "../../state/teamStore";

import { MaterialIcons } from "@expo/vector-icons";
import BowlerScorecard from "./BowlerScorecard";
import Scorecard from "./Scorecard";

export type PlayerOption = { id: string; name: string; teamId: string };

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
  const currentFixture = useFixtureStore((s) => s.currentFixture);

  const teamStore = useTeamStore();
  const myTeamId = currentFixture?.yourTeam.id;

  /*console.log(
    "Current Game Active Batters from store:",
    useGameStore.getState().currentGame?.activeBatters,
  );
  console.log(
    "Current Game Batting Entries:",
    useGameStore.getState().currentGame?.battingEntries,
  );*/
  //console.log("Team Players:", players);
  const effectiveMax = selectionMode === "single" ? 1 : maxSelection;

  const [selectedIds, setSelectedIds] = useState<string[]>(
    parentSelectedIds ?? [],
  );

  useEffect(() => {
    if (visible) {
      setSelectedIds(parentSelectedIds ?? []);
    }
  }, [visible, parentSelectedIds]);

  const togglePlayer = (playerId: string) => {
    //console.log("=== togglePlayer START ===");
    //console.log("Clicked playerId:", playerId);
    //console.log("Picker type:", pickerType);
    //console.log("Current selectedIds:", selectedIds);
    //console.log("CurrentGame activeBatters:", currentGame?.activeBatters);
    //console.log("CurrentGame battingEntries:", currentGame?.battingEntries);
    /*console.log( 
      "activeBatters full detail:",
      JSON.stringify(currentGame?.activeBatters, null, 2),
    );*/

    setSelectedIds((prev) => {
      //console.log("Previous selectedIds inside setter:", prev);
      /*console.log(
        "activeBatters BEFORE toggle:",
        JSON.stringify(currentGame?.activeBatters, null, 2),
      );*/

      if (pickerType === "bowler") {
        //console.log("Single-selection mode: bowler");
        const next = [playerId];
        onSelectionChange(next);

        const { updateLastBowlerId } = useGameStore.getState();
        updateLastBowlerId(null);

        /*console.log(
          "🎯 Bowler selected → lastBowlerId cleared",
          currentGame?.lastBowlerId,
        );*/

        return;
      }

      const gameStore = useGameStore.getState();
      const game = gameStore.currentGame;
      if (!game || pickerType !== "batter") {
        /*console.log("Exiting togglePlayer early:", {
          gameExists: !!game,
          pickerType,
        });*/
        return prev;
      }

      const activeBatter = game.activeBatters.find(
        (b) => b.playerId === playerId,
      );

      const playerEntry = currentGame?.battingEntries
        .filter((e) => e.playerId === playerId)
        .sort((a, b) => b.inningsNumber - a.inningsNumber)[0];

      const batterInningId = playerEntry?.entryId;

      //console.log("activeBatter:", activeBatter);
      //console.log("playerEntry:", playerEntry);
      //console.log("batterInningId:", batterInningId);
      //console.log("Previous selectedIds:", prev);

      const matchStore =
        require("../../state/matchStore").useMatchStore.getState();
      const events = matchStore.events ?? [];

      const ballsFaced = batterInningId
        ? events.filter(
            (ev) => ev.batterInningId === batterInningId && ev.countsAsBall,
          ).length
        : 0;
      const runs = playerEntry?.runs ?? 0;

      //console.log("ballsFaced:", ballsFaced, "runs:", runs);
      /*console.log(
        "Current game activeBatters before toggle:",
        game.activeBatters,
      );*/

      // ✅ check against activeBatters, not selectedIds
      const isSelected = game.activeBatters.some(
        (b) => b.playerId === playerId,
      );
      //console.log("isSelected?", isSelected);

      let nextSelected = [...prev]; // will be synced at the end
      let newActiveBatters = [...game.activeBatters];

      const entryId = playerEntry?.entryId ?? activeBatter?.batterInningId;

      // ---- REMOVE player if empty ----
      if (isSelected && ballsFaced === 0 && entryId) {
        //console.log("Removing player from selectedIds and activeBatters");

        nextSelected = nextSelected.filter((id) => id !== playerId);
        newActiveBatters = newActiveBatters.filter(
          (b) => b.playerId !== playerId,
        );

        const newBattingEntries = game.battingEntries.filter(
          (e) => !(e.playerId === playerId && e.entryId === entryId),
        );

        /*console.log("Updating gameStore after removal:", {
          nextSelected,
          newActiveBatters,
          newBattingEntries,
        });*/

        gameStore.updateCurrentGame({
          ...game,
          activeBatters: newActiveBatters,
          battingEntries: newBattingEntries,
        });

        /*console.log(
          "activeBatters AFTER removal:",
          JSON.stringify(newActiveBatters, null, 2),
        );*/
      }
      // ---- SINGLE select mode ----
      else if (
        selectionMode === "single" &&
        game.activeBatters.length >= effectiveMax
      ) {
        //console.log("Single-select mode: replacing existing batter");

        const existing = game.activeBatters[0];
        const updatedBatters = game.activeBatters.filter(
          (b) => b.playerId !== existing.playerId,
        );

        //console.log("Existing batter removed:", existing.playerId);

        gameStore.updateCurrentGame({
          ...game,
          activeBatters: updatedBatters,
        });

        nextSelected = [playerId];
        //console.log("Next selectedIds for single-select:", nextSelected);
      }
      // ---- MULTI-select: add new batter ----
      else {
        //console.log("Multi-select mode: adding new batter if not selected");

        if (!isSelected) {
          nextSelected = [...prev, playerId];
          //console.log("Next selectedIds after adding:", nextSelected);

          const retiredBatter = game.activeRetired?.find(
            (b) => b.playerId === playerId,
          );

          if (retiredBatter) {
            /*console.log(
              "Player is retired, removing retired event and re-adding to activeBatters",
            );*/

            matchStore.removeEventByPredicate?.((event: any) => {
              return (
                event.type === "wicket" &&
                event.kind === "retired" &&
                event.batterInningId === retiredBatter.batterInningId
              );
            });

            newActiveBatters = [...game.activeBatters, retiredBatter];
            gameStore.updateCurrentGame({
              ...game,
              activeBatters: newActiveBatters,
              activeRetired: game.activeRetired.filter(
                (b) => b.playerId !== playerId,
              ),
            });
          } // Inside the togglePlayer function, in the !activeBatter block:
          else if (!activeBatter) {
            //console.log("Normal new batter flow: adding to activeBatters");

            const newEntryId = `${playerId}-${Date.now()}`;
            const newEntry = {
              entryId: newEntryId,
              playerId: playerId,
              inningsNumber:
                (game.battingEntries.filter((e) => e.playerId === playerId)
                  .length || 0) + 1,
              battingOrder: (game.battingEntries.length || 0) + 1,
              runs: 0,
              balls: 0,
            };

            // ✅ 1. Update the variable that is used for the final sync at the end of togglePlayer
            newActiveBatters = [
              ...game.activeBatters,
              { playerId, batterInningId: newEntryId },
            ];

            const isFirstBatter = game.activeBatters.length === 0;

            gameStore.updateCurrentGame({
              ...game,
              activeBatters: newActiveBatters,
              battingEntries: [...game.battingEntries, newEntry],
              currentEntryId: newEntryId,
              currentStrikeId: isFirstBatter
                ? playerId
                : (game.currentStrikeId ?? newActiveBatters[0]?.playerId),
            });

            //console.log("New batter added and strike set to:", playerId);
          }
        } else {
          console.log("Player already selected, no action taken");
        }
      }

      //console.log("Setting selectedIds and notifying parent");
      nextSelected = newActiveBatters.map((b) => b.playerId); // sync selectedIds with activeBatters
      //console.log("Next selectedIds before setSelectedIds:", nextSelected);
      /*console.log(
        "activeBatters before final update:",
        JSON.stringify(gameStore.currentGame?.activeBatters, null, 2),
      );*/

      /*
      setSelectedIds(nextSelected);
      onSelectionChange(nextSelected);
      return nextSelected;
      */

      setSelectedIds((prev) => nextSelected);
      onSelectionChange(nextSelected);
      return nextSelected;
    });
  };

  // Notify parent whenever selection changes
  /*
  useEffect(() => {
    onSelectionChange(selectedIds);
    console.log("onSelectionChange called with:", selectedIds);
  }, [selectedIds]);
  */
  //const filteredPlayers = players.filter((p) => showArchived || !p.archived);
  const filteredPlayers = players.map((p) => ({
    ...p,
    hidden: !showArchived && p.archived,
  }));

  const startEditing = (player: PlayerOption) => {
    setEditingPlayerId(player.id);
    setEditedName(player.name);
  };

  /*
  const saveEdit = (playerId: string) => {
    if (!editedName.trim()) return;

    // ⚠️ You need teamId — pass it in as prop if not available here
    const teamId = currentGame?.battingTeamId || currentGame?.bowlingTeamId;
    if (!teamId) return;

    updatePlayerName(teamId, playerId, editedName.trim());
    setEditingPlayerId(null);
  };
  */

  const saveEdit = (playerId: string, teamId: string) => {
    if (!editedName.trim()) return;
    if (!teamId) return;

    updatePlayerName(teamId, playerId, editedName.trim());
    setEditingPlayerId(null);
  };

  const archivePlayer = useTeamStore((s) => s.archivePlayer);

  // enrich filteredPlayers with teamId & myTeam
  const enrichedPlayers = filteredPlayers.map((p) => ({
    ...p,
    myTeam: p.teamId === myTeamId,
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.safe}>
          <View
            style={styles.container}
            onTouchStart={() =>
              console.log(
                `[Container Touch] Layout container intercepted a touch at: ${Date.now()}`,
              )
            }
          >
            <FlatList
              style={[styles.scroll, { flex: 1, minHeight: 200 }]} // Force it to fill available room cleanly
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              data={enrichedPlayers}
              keyExtractor={(player) => player.id}
              ListHeaderComponent={() => (
                <>
                  {/* Only render the relevant scorecard */}
                  {pickerType === "batter" && <Scorecard />}
                  {pickerType === "bowler" && <BowlerScorecard />}
                  <Text style={styles.title}>{title}</Text>
                </>
              )}
              renderItem={({ item: player }) => {
                /*console.log({
                  player: player.name,
                  playerTeamId: player.teamId,
                  myTeamId,
                  myTeam: player.myTeam,
                });*/
                const matchStore =
                  require("../../state/matchStore").useMatchStore.getState();
                const currentEvents = matchStore.events ?? [];

                const playerEntry = currentGame?.battingEntries
                  .filter((e) => e.playerId === player.id)
                  .sort((a, b) => b.inningsNumber - a.inningsNumber)[0];

                const batterInningId = playerEntry?.entryId;

                const retiredBatter = currentGame?.activeRetired?.find(
                  (b) => b.playerId === player.id,
                );
                const isRetired = !!retiredBatter;

                const selected = currentGame?.activeBatters?.some(
                  (b) => b.playerId === player.id,
                );

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
                          <Pressable
                            onPress={() => saveEdit(player.id, player.teamId)}
                          >
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

                          {/* Stats button */}
                          {player.myTeam && (
                            <Pressable
                              style={{ marginLeft: 8 }}
                              onPress={() => {
                                useGameStore
                                  .getState()
                                  .openStatsModal(player.id);
                                onClose(); // close modal
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
              }}
              ListFooterComponent={() => (
                <>
                  {pickerType === "batter" && (
                    <Text>
                      Choose players from the list above to select as batting.
                    </Text>
                  )}
                  {pickerType === "bowler" && (
                    <Text>
                      Choose players from the list above to select as bowling.
                    </Text>
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

                  {/* Add padding so keyboard doesn't squash it */}
                  <View style={{ height: 40 }} />
                </>
              )}
            />

            {/* ✅ MOVE FOOTER HERE */}
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
              <Text style={styles.closeButtonText}>Continue</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingTop: "5%" },
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
