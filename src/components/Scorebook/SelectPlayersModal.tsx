// src/components/Scorebook/SelectPlayersModal.tsx
// Decoupled player selection modal: accepts only a list of players and selection mode.
// Callers are responsible for fetching/preparing the player list and optional footer UI.
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGameStore } from "../../state/gameStore";

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

    setSelectedIds((prev) => {
      if (pickerType === "bowler") {
        // Single-selection mode for bowler
        const next = [playerId];
        setSelectedIds(next);
        onSelectionChange(next);
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

      console.log("we are at least hitting! 2", {
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
      const ballsFaced = batterEvents.length;

      console.log(
        "Batter events for current inning:",
        batterEvents,
        "Balls faced:",
        ballsFaced,
      );

      // Check if player is already selected
      const isSelected = prev.some((b) => {
        if (typeof b === "string") return b === playerId;
        return b.playerId === playerId;
      });

      if (isSelected) {
        if (playerEntry && playerEntry.runs === 0 && ballsFaced === 0) {
          const newActiveBatters = game.activeBatters.filter(
            (b) => b.playerId !== playerId,
          );
          const newBattingEntries = game.battingEntries.filter(
            (e) => e.entryId !== playerEntry.entryId,
          );

          gameStore.updateCurrentGame({
            ...game,
            activeBatters: newActiveBatters,
            battingEntries: newBattingEntries,
          });

          // Remove from prev
          next = prev.filter((b) =>
            typeof b === "string" ? b !== playerId : b.playerId !== playerId,
          );
        } else {
          // Can't untoggle if player has faced balls or scored
          next = prev;
        }
      } else if (prev.length >= effectiveMax) {
        // max selection reached
        next = prev;
      } else {
        // 🔵 Add new batter
        next = [...prev, playerId];

        // Handle retired batter
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

      onSelectionChange(next);
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

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Only render the relevant scorecard */}
          {pickerType === "batter" && <Scorecard />}
          {pickerType === "bowler" && <BowlerScorecard />}
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.scroll}>
            {players.length > 0 ? (
              players.map((player) => {
                const activeBatter = currentGame?.activeBatters?.find(
                  (b) => b.playerId === player.id,
                );

                // Get the latest batting entry for this player
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
                  <Pressable
                    key={player.id}
                    onPress={() => togglePlayer(player.id)}
                    style={[
                      styles.playerItem,
                      { backgroundColor: selected ? "#12c2e9" : "#f0f0f0" },
                    ]}
                  >
                    <Text style={{ color: selected ? "#fff" : "#000" }}>
                      {player.name}
                      {isRetired ? " — retired (tap to continue innings)" : ""}
                      {playerEntry
                        ? ` — ${playerEntry.runs} (${playerEntry.balls})`
                        : ""}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.noPlayers}>
                <Text style={styles.noPlayersText}>
                  No players in this list.
                </Text>
              </View>
            )}
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
});
