// src/components/Scorebook/SelectPlayersModal.tsx
// Decoupled player selection modal: accepts only a list of players and selection mode.
// Callers are responsible for fetching/preparing the player list and optional footer UI.
"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";

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
}: SelectPlayersModalProps) {
  const effectiveMax = selectionMode === "single" ? 1 : maxSelection;

  const [selectedIds, setSelectedIds] = useState<string[]>(parentSelectedIds);

  useEffect(() => {
    if (visible) {
      setSelectedIds(parentSelectedIds);
    }
  }, [visible, parentSelectedIds]);

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) => {
      let next: string[];
      if (prev.includes(playerId)) {
        next = prev.filter((id) => id !== playerId);
      } else if (prev.length >= effectiveMax) {
        next = prev;
      } else {
        next = [...prev, playerId];
      }
      return next;
    });
  };
  useEffect(() => onSelectionChange(selectedIds), [selectedIds]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.scroll}>
            {players.length > 0 ? (
              players.map((player) => {
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
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.noPlayers}>
                <Text style={styles.noPlayersText}>No players in this list.</Text>
              </View>
            )}
          </ScrollView>

          {renderFooter?.()}

          <Pressable onPress={onClose} style={styles.closeButton}>
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
