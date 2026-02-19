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
    setSelectedIds((prev) => {
      let next: string[];
      const gameStore = useGameStore.getState();

      if (prev.includes(playerId)) {
        next = prev.filter((id) => id !== playerId);
      } else if (prev.length >= effectiveMax) {
        next = prev;
      } else {
        next = [...prev, playerId];

        if (pickerType === "batter" && gameStore.currentGame) {
          const game = gameStore.currentGame;

          const retiredBatter = game.activeRetired?.find(
            (b) => b.playerId === playerId,
          );

          // 🟢 RETURN RETIRED BATTER
          if (retiredBatter) {
            console.log("Returning retired batter:", playerId);

            const matchStore =
              require("../../state/matchStore").useMatchStore.getState();

            matchStore.removeEventByPredicate?.((event: any) => {
              return (
                event.type === "wicket" &&
                event.kind === "retired" &&
                event.batterInningId === retiredBatter.batterInningId
              );
            });

            // Move from activeRetired → activeBatters
            gameStore.updateCurrentGame({
              activeBatters: [...game.activeBatters, retiredBatter],
              activeRetired: game.activeRetired.filter(
                (b) => b.playerId !== playerId,
              ),
            });

            // ✅ Add to selection if not already selected
            next = [...(prev ?? []), playerId];

            return next;
          }

          // 🔵 NORMAL NEW BATTER FLOW
          if (!game.activeBatters.some((b) => b.playerId === playerId)) {
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

      console.log(`Toggled player: ${playerId}`);
      console.log("Selected IDs after toggle:", next);

      console.log(
        "Current Game Active Batters from store 2:",
        gameStore.currentGame?.activeBatters,
      );
      console.log(
        "Current Game Batting Entries 2:",
        gameStore.currentGame?.battingEntries,
      );

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

                const playerEntry = currentGame?.battingEntries?.find(
                  (e) => e.entryId === activeBatter?.batterInningId,
                );

                const retiredBatter = currentGame?.activeRetired?.find(
                  (b) => b.playerId === player.id,
                );

                const isRetired = !!retiredBatter;

                const selected = selectedIds.includes(player.id);

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
