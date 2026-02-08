// src/components/Scorebook/BowlerPicker.tsx
"use client";

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LEGAL_BALLS, useGameStore } from "../../state/gameStore";
import type { Team } from "../../state/teamStore";
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
  const [showModal, setShowModal] = useState(false);

  const currentGame = useGameStore((s) => s.currentGame);
  const setBowlingTeam = useGameStore((s) => s.setBowlingTeam);
  const addBowler = useGameStore((s) => s.addBowler);
  const setCurrentBowler = useGameStore((s) => s.setCurrentBowler);

  useEffect(() => {
    if (!bowlingTeam) return;
    const gameState = useGameStore.getState();
    if (!gameState.currentGame) return;

    if (gameState.currentGame.bowlingTeamId !== bowlingTeam.id) {
      setBowlingTeam(bowlingTeam.id);
    }

    if (selectedBowlerId) {
      const exists = gameState.currentGame.bowlers.some(
        (b) => b.playerId === selectedBowlerId,
      );
      if (!exists) addBowler(selectedBowlerId);
      setCurrentBowler(selectedBowlerId);
    }
  }, [
    bowlingTeam,
    selectedBowlerId,
    setBowlingTeam,
    addBowler,
    setCurrentBowler,
  ]);

  const handleCloseModal = () => setShowModal(false);

  const getBowlerStats = (playerId: string) => {
    if (!currentGame) return { wickets: 0, runsConceded: 0, overs: "0" };
    const bowler = currentGame.bowlers.find((b) => b.playerId === playerId);
    if (!bowler) return { wickets: 0, runsConceded: 0, overs: "0" };
    const overs = (bowler.ballsBowled / LEGAL_BALLS).toFixed(1);
    return {
      wickets: bowler.wickets,
      runsConceded: bowler.runsConceded,
      overs,
    };
  };

  return (
    <>
      <Pressable style={styles.addBowlers} onPress={() => setShowModal(true)}>
        <Text style={styles.addBowlersTitle}>Select Bowler</Text>

        {selectedBowlerId && bowlingTeam ? (
          <View style={styles.selectedBowlerContainer}>
            {bowlingTeam.players
              .filter((p) => p.id === selectedBowlerId)
              .map((p) => {
                const stats = getBowlerStats(p.id);
                const isCurrent = currentGame?.currentBowlerId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.selectedBowlerItem,
                      isCurrent && styles.currentBowler,
                    ]}
                    onPress={() => setCurrentBowler(p.id)}
                  >
                    <View style={styles.bowlerRow}>
                      <Text style={styles.bowlerIcon}>
                        {isCurrent ? "🎯" : "  "}
                      </Text>
                      <Text style={styles.selectedBowlerText}>
                        {p.name} — {stats.wickets}/{stats.runsConceded} (
                        {stats.overs} ov)
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
          </View>
        ) : (
          <Text style={styles.placeholder}>
            Select current bowler to track bowling stats
          </Text>
        )}
      </Pressable>

      {bowlingTeam && (
        <SelectPlayersModal
          visible={showModal}
          onClose={handleCloseModal}
          title="Select Bowler"
          players={bowlingTeam.players}
          selectedIds={selectedBowlerId ? [selectedBowlerId] : []}
          onSelectionChange={(ids) =>
            onSelectionChange(ids.length > 0 ? ids[0] : null)
          }
          selectionMode="single"
          renderFooter={() => (
            <AddPlayerFooter teamId={bowlingTeam.id} onAdded={() => {}} />
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addBowlers: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#c471ed",
  },
  addBowlersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  selectedBowlerContainer: { marginTop: 8 },
  selectedBowlerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedBowlerText: { fontSize: 16, color: "#0f172a", fontWeight: "500" },
  bowlerRow: { flexDirection: "row", alignItems: "center" },
  bowlerIcon: {
    width: 20,
    textAlign: "center",
    marginRight: 8,
    fontWeight: "700",
  },
  currentBowler: {
    borderColor: "#c471ed",
    borderWidth: 2,
    backgroundColor: "#f5e6ff",
    borderRadius: 8,
  },
  placeholder: { fontSize: 14, color: "#64748b", marginTop: 4 },
});
