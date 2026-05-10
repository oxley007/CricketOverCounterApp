// src/screens/StatsScreen.tsx
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import SubscriptionList from "../components/iap/SubscriptionList";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { useFixtureStore } from "../state/fixtureStore";
import {
  getSeasonPlayers,
  getSeasonPlayerStats,
  getSeasonTeamStats,
} from "../state/seasonStatsHelpers";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { getActiveTeams } from "../utils/getActiveTeams";

export default function StatsScreen() {
  const { teams } = useTeamStore();
  const { fixtures } = useFixtureStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"player" | "team">("player");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const startModal = useStartModalStore();

  const openGameModeModal = () => {
    router.replace("/");
    setTimeout(() => startModal.reset(), 100);
  };

  /* =========================
     DERIVED TEAMS
  ========================= */
  const yourTeams = useMemo(() => {
    return getActiveTeams(fixtures, teams);
  }, [fixtures, teams]);

  /* =========================
     DERIVED SEASONS
  ========================= */
  const seasons = useMemo(() => {
    if (!selectedTeamId) return [];
    return Array.from(
      new Set(
        fixtures
          .filter((f) => (f.yourTeamId ?? f.yourTeam?.id) === selectedTeamId)
          .map((f) => f.season)
          .filter(Boolean),
      ),
    ).sort();
  }, [fixtures, selectedTeamId]);

  /* =========================
     SELECTED TEAM
  ========================= */
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  /* =========================
     PLAYER LIST
  ========================= */
  const players = useMemo(() => {
    if (!selectedTeam || !selectedSeason) return [];
    return getSeasonPlayers({
      fixtures,
      team: selectedTeam,
      season: selectedSeason,
    });
  }, [fixtures, selectedTeam, selectedSeason]);

  /* =========================
     TEAM STATS
  ========================= */
  const selectedTeamStats = useMemo(() => {
    if (!selectedTeam || !selectedSeason) return null;

    return getSeasonTeamStats({
      fixtures,
      team: selectedTeam, // <-- pass the full team object
      season: selectedSeason,
    });
  }, [fixtures, selectedTeam, selectedSeason]);

  /* =========================
     PLAYER STATS
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

      <View style={styles.separator} />

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

      <View style={styles.separator} />

      {/* ================= TEAM STATS BUTTON ================= */}
      {selectedTeam && selectedSeason && (
        <Pressable
          style={[styles.selectorCard, styles.teamStatsCard]}
          onPress={() => {
            setModalType("team");
            setModalVisible(true);
          }}
        >
          <Text style={[styles.selectorText, { fontWeight: "700" }]}>
            {selectedTeam.name} - Team Stats
          </Text>
        </Pressable>
      )}

      {/* ================= PLAYER LIST ================= */}
      <Text style={styles.sectionHeader}>Individual Stats:</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setSelectedPlayerId(item.id);
              setModalType("player");
              setModalVisible(true);
            }}
            style={styles.selectorCard}
          >
            <Text style={styles.selectorText}>{item.name}</Text>
          </Pressable>
        )}
      />

      {/* ================= STATS MODAL ================= */}
      <PlayerStatsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={
          modalType === "player"
            ? (selectedTeam?.players.find((p) => p.id === selectedPlayerId)
                ?.name ?? "")
            : (selectedTeam?.name ?? "")
        }
        stats={modalType === "player" ? selectedPlayerStats : selectedTeamStats}
        type={modalType}
        onUpgrade={() => setShowSubscriptionModal(true)} // <-- add this
      />

      <View style={{ marginBottom: 16 }}>
        <Pressable style={styles.modalButton} onPress={openGameModeModal}>
          <Text style={styles.modalButtonText}>Back to Select Game Mode</Text>
        </Pressable>
      </View>

      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tier="coach"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#12c2e9" },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1.2,
  },
  selectorRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 0 },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    elevation: 3,
  },
  selectorCardSelected: { backgroundColor: "#c471ed" },
  selectorText: { fontSize: 16, fontWeight: "600", color: "#333" },
  selectorTextSelected: { color: "#fff" },
  modalButton: {
    backgroundColor: "#c471ed",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },
  modalButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 12,
    borderRadius: 2,
  },
  teamStatsCard: {
    borderWidth: 2,
    borderColor: "#ffb74d",
    backgroundColor: "#f5f5f5",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "left",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.5)",
    paddingBottom: 4,
  },
});
