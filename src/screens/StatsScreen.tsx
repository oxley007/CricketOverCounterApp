import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { useFixtureStore } from "../state/fixtureStore";
import {
    getSeasonPlayers,
    getSeasonPlayerStats,
} from "../state/seasonStatsHelpers";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";

export default function StatsScreen() {
  const { teams } = useTeamStore();
  const { fixtures } = useFixtureStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const startModal = useStartModalStore();

  const openGameModeModal = () => {
    router.replace("/"); // go to home screen
    setTimeout(() => {
      startModal.reset(); // open the StartModeModal
    }, 100); // slight delay to allow navigation
  };
  /* =========================
     DERIVED TEAMS
  ========================= */
  const yourTeams = useMemo(() => {
    const map = new Map();
    fixtures.forEach((f) => map.set(f.yourTeam.id, f.yourTeam.id));
    return teams.filter((t) => map.has(t.id));
  }, [fixtures, teams]);

  /* =========================
     DERIVED SEASONS
  ========================= */
  const seasons = useMemo(() => {
    if (!selectedTeamId) return [];
    return Array.from(
      new Set(
        fixtures
          .filter((f) => f.yourTeam.id === selectedTeamId)
          .map((f) => f.season),
      ),
    ).sort();
  }, [fixtures, selectedTeamId]);

  /* =========================
     PLAYER LIST
  ========================= */
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const players = useMemo(() => {
    if (!selectedTeam || !selectedSeason) return [];
    return getSeasonPlayers({
      fixtures,
      team: selectedTeam,
      season: selectedSeason,
    });
  }, [fixtures, selectedTeam, selectedSeason]);

  /* =========================
     SELECTED PLAYER STATS
  ========================= */
  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayerId || !selectedTeamId || !selectedSeason) return null;
    return getSeasonPlayerStats({
      fixtures,
      teamId: selectedTeamId,
      season: selectedSeason,
      playerId: selectedPlayerId,
    });
  }, [fixtures, selectedPlayerId, selectedTeamId, selectedSeason]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Season Stats</Text>
      {/* ================= TEAM SELECT ================= */}
      <View style={styles.selectorRow}>
        {yourTeams.map((team) => (
          <Pressable
            key={team.id}
            onPress={() => {
              setSelectedTeamId(team.id);
              setSelectedSeason(null);
            }}
            style={[
              styles.selectorCard,
              selectedTeamId === team.id && styles.selectorCardSelected,
            ]}
          >
            <Text
              style={[
                styles.selectorText,
                selectedTeamId === team.id && styles.selectorTextSelected,
              ]}
            >
              {team.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.separator} /> {/* ← separator */}
      {/* ================= SEASON SELECT ================= */}
      <View style={styles.selectorRow}>
        {seasons.map((season) => (
          <Pressable
            key={season}
            onPress={() => setSelectedSeason(season)}
            style={[
              styles.selectorCard,
              selectedSeason === season && styles.selectorCardSelected,
            ]}
          >
            <Text
              style={[
                styles.selectorText,
                selectedSeason === season && styles.selectorTextSelected,
              ]}
            >
              {season}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.separator} /> {/* ← separator */}
      {/* ================= PLAYER LIST ================= */}
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setSelectedPlayerId(item.id);
              setModalVisible(true);
            }}
            style={styles.selectorCard}
          >
            <Text style={styles.selectorText}>{item.name}</Text>
          </Pressable>
        )}
      />
      {/* PLAYER STATS MODAL */}
      <PlayerStatsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={
          selectedTeam?.players.find((p) => p.id === selectedPlayerId)?.name ??
          ""
        }
        stats={selectedPlayerStats}
      />
      <View style={{ marginBottom: 16 }}>
        <Pressable style={styles.modalButton} onPress={openGameModeModal}>
          <Text style={styles.modalButtonText}>Back to Select Game Mode</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#12c2e9",
  },
  title: {
    fontSize: 34, // bigger
    fontWeight: "bold",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1.2, // subtle spacing
    //textShadowColor: "rgba(0,0,0,0.3)",
    //textShadowOffset: { width: 1, height: 1 },
    //textShadowRadius: 4,
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 0,
  },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    elevation: 3,
  },
  selectorCardSelected: {
    backgroundColor: "#c471ed",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectorTextSelected: {
    color: "#fff",
  },
  modalButton: {
    backgroundColor: "#c471ed",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 12,
    borderRadius: 2,
  },
});
