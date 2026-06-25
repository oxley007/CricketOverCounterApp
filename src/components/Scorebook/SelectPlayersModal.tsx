// src/components/Scorebook/SelectPlayersModal.tsx
"use client";

import React, { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useTeamStore } from "../../state/teamStore";
import { usePlayerSelectionValidation } from "../../hooks/usePlayerSelectionValidation";
import { MaterialIcons } from "@expo/vector-icons";
import BowlerScorecard from "./BowlerScorecard";
import Scorecard from "./Scorecard";

export type PlayerOption = {
  id: string;
  name: string;
  teamId: string;
  archived?: boolean;
};
export type SelectionMode = "single" | "multiple";

export type SelectPlayersModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  players: PlayerOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectionMode: SelectionMode;
  maxSelection?: number;
  renderFooter?: () => ReactNode;
  pickerType?: "batter" | "bowler";
};

// 🌟 FIX 1: Extracted and Memoised Row Component to completely prevent unnecessary row paints
const PlayerRowItem = React.memo(
  ({
    player,
    selected,
    isRetired,
    isUpdating,
    isEditing,
    editedName,
    setEditedName,
    onToggle,
    onSaveEdit,
    onStartEdit,
    onArchive,
    onOpenStats,
  }: {
    player: PlayerOption;
    selected: boolean;
    isRetired: boolean;
    isEditing: boolean;
    isUpdating: boolean;
    editedName: string;
    setEditedName: (text: string) => void;
    onToggle: (id: string) => void;
    onSaveEdit: (id: string, teamId: string) => void;
    onStartEdit: (player: PlayerOption) => void;
    onArchive: (player: PlayerOption) => void;
    onOpenStats: (id: string) => void;
  }) => {
    return (
      <View
        style={[
          styles.playerItem,
          { backgroundColor: selected ? "#12c2e9" : "#f0f0f0" },
        ]}
      >
        <View style={styles.playerRow}>
          {isEditing ? (
            <>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                style={styles.input}
                autoFocus
              />
              <Pressable onPress={() => onSaveEdit(player.id, player.teamId)}>
                <MaterialIcons name="check" size={22} color="green" />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => onToggle(player.id)}
              >
                <Text
                  style={{
                    color: selected ? "#fff" : "#000",
                    fontWeight: selected ? "600" : "400",
                  }}
                >
                  {player.name}
                  {isRetired ? " — retired (tap to continue innings)" : ""}
                </Text>
              </Pressable>

              {isUpdating && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color={selected ? "#fff" : "#12c2e9"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: selected ? "#e0e0e0" : "#64748b",
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    Updating scorecard...
                  </Text>
                </View>
              )}

              {player.teamId && (
                <Pressable
                  style={{ marginLeft: 8 }}
                  onPress={() => onOpenStats(player.id)}
                >
                  <MaterialIcons name="bar-chart" size={30} color="red" />
                </Pressable>
              )}

              <Pressable
                onPress={() => onStartEdit(player)}
                style={{ paddingHorizontal: 6 }}
              >
                <MaterialIcons name="edit" size={20} color="#64748b" />
              </Pressable>

              <Pressable
                onPress={() => onArchive(player)}
                style={{ paddingHorizontal: 6 }}
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
  },
);

PlayerRowItem.displayName = "PlayerRowItem";

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
  const archivePlayer = useTeamStore((s) => s.archivePlayer);
  const currentFixture = useFixtureStore((s) => s.currentFixture);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);
  /*const [selectedIds, setSelectedIds] = useState<string[]>(
    parentSelectedIds ?? [],
  );*/

  const myTeamId = currentFixture?.yourTeam.id;
  const effectiveMax = selectionMode === "single" ? 1 : maxSelection;

  const { handleContinue } = usePlayerSelectionValidation({
    pickerType,
    activeBatters: currentGame?.activeBatters,
    currentBowlerId: currentGame?.currentBowlerId,
    onClose,
  });

  /*
  useEffect(() => {
    if (visible) {
      setSelectedIds(parentSelectedIds ?? []);
    }
  }, [visible, parentSelectedIds]);
  */

  // 2. Wrap your existing togglePlayer logic to set the loading state
  const togglePlayer = async (playerId: string) => {
    setLoadingPlayerId(playerId);

    // Small delay ensures UI gets a chance to render the spinner before blocking the thread
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // === YOUR ORIGINAL CODE STARTS HERE ===
      const currentSelectedIds = parentSelectedIds ?? [];

      if (pickerType === "bowler") {
        const next = [playerId];
        onSelectionChange(next);
        useGameStore.getState().updateLastBowlerId(null);
        return;
      }

      const gameStore = useGameStore.getState();
      const game = gameStore.currentGame;
      if (!game || pickerType !== "batter") return;

      const matchStore =
        require("../../state/matchStore").useMatchStore.getState();
      const events = matchStore.events ?? [];

      const sortedEntries = game.battingEntries
        .filter((e) => e.playerId === playerId)
        .sort((a, b) => (b.inningsNumber || 0) - (a.inningsNumber || 0));

      const playerEntry = sortedEntries[0] || null;
      const batterInningId = playerEntry?.entryId;

      const ballsFaced = batterInningId
        ? events.filter(
            (ev) => ev.batterInningId === batterInningId && ev.countsAsBall,
          ).length
        : 0;
      const isSelected = game.activeBatters.some(
        (b) => b.playerId === playerId,
      );

      let nextSelected = [...currentSelectedIds];
      let newActiveBatters = [...game.activeBatters];
      const entryId =
        playerEntry?.entryId ||
        game.activeBatters.find((b) => b.playerId === playerId)?.batterInningId;

      if (isSelected && ballsFaced === 0 && entryId) {
        nextSelected = nextSelected.filter((id) => id !== playerId);
        newActiveBatters = newActiveBatters.filter(
          (b) => b.playerId !== playerId,
        );
        const newBattingEntries = game.battingEntries.filter(
          (e) => !(e.playerId === playerId && e.entryId === entryId),
        );

        gameStore.updateCurrentGame({
          ...game,
          activeBatters: newActiveBatters,
          battingEntries: newBattingEntries,
        });
      } else if (
        selectionMode === "single" &&
        game.activeBatters.length >= effectiveMax
      ) {
        const existing = game.activeBatters[0];
        const updatedBatters = game.activeBatters.filter(
          (b) => b.playerId !== existing.playerId,
        );

        gameStore.updateCurrentGame({
          ...game,
          activeBatters: updatedBatters,
        });
        nextSelected = [playerId];
      } else if (!isSelected) {
        nextSelected = [...currentSelectedIds, playerId];
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

          newActiveBatters = [...game.activeBatters, retiredBatter];
          gameStore.updateCurrentGame({
            ...game,
            activeBatters: newActiveBatters,
            activeRetired: game.activeRetired.filter(
              (b) => b.playerId !== playerId,
            ),
          });
        } else {
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
        }
      }

      const unifiedSelection = newActiveBatters.map((b) => b.playerId);
      onSelectionChange(unifiedSelection);
      // === YOUR ORIGINAL CODE ENDS HERE ===
    } finally {
      setLoadingPlayerId(null);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => showArchived || !p.archived);
  }, [players, showArchived]);

  const enrichedPlayers = useMemo(() => {
    return filteredPlayers.map((p) => ({
      ...p,
      myTeam: p.teamId === myTeamId,
    }));
  }, [filteredPlayers, myTeamId]);

  const startEditing = (player: PlayerOption) => {
    setEditingPlayerId(player.id);
    setEditedName(player.name);
  };

  const saveEdit = (playerId: string, teamId: string) => {
    if (!editedName.trim() || !teamId) return;
    updatePlayerName(teamId, playerId, editedName.trim());
    setEditingPlayerId(null);
  };

  const handleArchivePress = (player: PlayerOption) => {
    const teamId = currentGame?.battingTeamId || currentGame?.bowlingTeamId;
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
            onPress: () => archivePlayer(teamId, player.id, true),
          },
        ],
        { cancelable: true },
      );
    } else {
      archivePlayer(teamId, player.id, false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <FlashList
              style={styles.scroll}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              data={enrichedPlayers}
              keyExtractor={(player) => player.id}
              estimatedItemSize={60}
              ListHeaderComponent={() => (
                <>
                  {pickerType === "batter" && <Scorecard />}
                  {pickerType === "bowler" && <BowlerScorecard />}
                  <Text style={styles.title}>{title}</Text>
                </>
              )}
              renderItem={({ item: player }) => {
                const isSelected = parentSelectedIds.includes(player.id);
                const isRetired = !!currentGame?.activeRetired?.some(
                  (b) => b.playerId === player.id,
                );

                return (
                  <PlayerRowItem
                    player={player}
                    selected={isSelected}
                    isRetired={isRetired}
                    isEditing={editingPlayerId === player.id}
                    isUpdating={loadingPlayerId === player.id}
                    editedName={editedName}
                    setEditedName={setEditedName}
                    onToggle={togglePlayer}
                    onSaveEdit={saveEdit}
                    onStartEdit={startEditing}
                    onArchive={handleArchivePress}
                    onOpenStats={(id) => {
                      useGameStore.getState().openStatsModal(id);
                      onClose();
                    }}
                  />
                );
              }}
              ListFooterComponent={() => (
                <>
                  {pickerType === "batter" && (
                    <Text style={styles.footerHelpText}>
                      Choose players from the list above to select as batting.
                    </Text>
                  )}
                  {pickerType === "bowler" && (
                    <Text style={styles.footerHelpText}>
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
                  <View style={{ height: 40 }} />
                </>
              )}
            />

            {renderFooter?.()}

            <Pressable onPress={handleContinue} style={styles.closeButton}>
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
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noPlayers: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  noPlayersText: { color: "#64748b", fontSize: 15 },
  footerHelpText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  closeButton: {
    backgroundColor: "#12c2e9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  closeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
