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
import { useTeamStore, Team } from "../state/teamStore";
import { useLiveStore } from "../state/liveStore";

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

  // Helper utility to safely compare local and remote team identifiers
  const normalize = (id: string) => id?.replace("TEAM-", "").toLowerCase();

  /* ========================= 1. DERIVED TEAMS (MERGED) ========================= */
  const supporterTeamNames = useLiveStore((s) => s.supporterTeamNames);

  const yourTeams = useMemo(() => {
    const supporterCodes = useLiveStore.getState().teamCodesSupporter || [];
    const uniqueTeams = new Map();

    // Add your managed teams
    teams.forEach((t) => {
      uniqueTeams.set(normalize(t.id), { ...t, isSupporter: false });
    });

    // Merge in supporter teams
    supporterCodes.forEach((code) => {
      const normalizedId = normalize(code);
      if (!uniqueTeams.has(normalizedId)) {
        uniqueTeams.set(normalizedId, {
          id: code, // Keep original casing for lookups
          name: supporterTeamNames[code] || code,
          isSupporter: true,
        });
      }
    });

    return Array.from(uniqueTeams.values());
  }, [teams, supporterTeamNames]);

  /* ========================= 2. DERIVED SEASONS ========================= */
  const seasons = useMemo(() => {
    if (!selectedTeamId) return [];
    const targetId = normalize(selectedTeamId);

    const filteredSeasons = fixtures
      .filter(
        (f) => normalize(f.yourTeam?.id || f.yourTeamId || "") === targetId,
      )
      .map((f) => f.season)
      .filter(Boolean);

    return Array.from(new Set(filteredSeasons)).sort().reverse();
  }, [fixtures, selectedTeamId]);

  /* ========================= 3. SELECTED TEAM PROFILE LOOKUP ========================= */
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    const targetId = normalize(selectedTeamId);

    // Look inside your local team store first
    const managedTeam = teams.find((t) => normalize(t.id) === targetId);
    if (managedTeam) return managedTeam;

    // Build a dynamic team skeleton from downloaded fixture schemas if it's a supporter team
    const matchMetadata = yourTeams.find((t) => normalize(t.id) === targetId);

    // Scan all matching downloaded fixtures to piece together a collection of players
    const extractedPlayersMap = new Map();
    fixtures
      .filter(
        (f) => normalize(f.yourTeam?.id || f.yourTeamId || "") === targetId,
      )
      .forEach((f) => {
        // Fall back to scanning any inner innings records if parent references are slim
        (f.innings || []).forEach((inn) => {
          (inn.battingEntries || []).forEach((b) => {
            if (b.playerId && b.playerName) {
              extractedPlayersMap.set(b.playerId, {
                id: b.playerId,
                name: b.playerName,
              });
            }
          });
        });
      });

    return {
      id: selectedTeamId,
      name: matchMetadata?.name || "Supporter Team",
      players: Array.from(extractedPlayersMap.values()),
    } as Team;
  }, [selectedTeamId, teams, yourTeams, fixtures]);

  /* ========================= SELECT LIVE SELECTION STATES ========================= */
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

  // Check if the currently active selected team is a supporter profile card
  const isCurrentTeamSupporter = useMemo(() => {
    if (!selectedTeamId) return false;
    const match = yourTeams.find(
      (t) => normalize(t.id) === normalize(selectedTeamId),
    );
    return !!match?.isSupporter;
  }, [selectedTeamId, yourTeams]);

  /* ========================= 4. PLAYER LIST ========================= */
  /* ========================= 4. DYNAMIC PLAYER LIST ========================= */
  const players = useMemo(() => {
    if (!selectedTeam || !selectedSeason) return [];

    // 1. Get the baseline list of players who played in this season
    const allSeasonPlayers = getSeasonPlayers({
      fixtures,
      team: selectedTeam,
      season: selectedSeason,
      isLiveViewer: isCurrentTeamSupporter,
      liveViewTeams: liveViewTeams,
    });

    // 2. If it's a managed team, show everyone normally
    if (!isCurrentTeamSupporter) {
      return allSeasonPlayers;
    }

    // 3. For supporter teams, check what player IDs are tracked in the store
    const playerCodesSupporter =
      useLiveStore.getState().playerCodesSupporter || [];

    // Clean and normalize the tracked IDs for bulletproof matching
    const cleanTrackedIds = playerCodesSupporter.map((id) =>
      id.trim().toUpperCase(),
    );

    // 4. Look to see if any of our tracked players actually exist in this team's roster
    const teamTrackedPlayers = allSeasonPlayers.filter((p) =>
      cleanTrackedIds.includes(p.id.toUpperCase()),
    );

    // 5. Smart Filtering Decision:
    // If the user linked a specific player ID, show ONLY that player.
    // If they linked via Team ID only (leaving player codes empty), show all players.
    if (teamTrackedPlayers.length > 0) {
      return teamTrackedPlayers;
    }

    return allSeasonPlayers;
  }, [
    fixtures,
    selectedTeam,
    selectedSeason,
    isCurrentTeamSupporter,
    liveViewTeams,
  ]);

  /* ========================= 5. TEAM STATS ========================= */
  const selectedTeamStats = useMemo(() => {
    if (!selectedTeam || !selectedSeason) return null;

    return getSeasonTeamStats({
      fixtures,
      // 🧼 FIX: Pass the clean, base ID (stripping away "TEAM-")
      team: {
        ...selectedTeam,
        id: normalize(selectedTeam.id),
      },
      season: selectedSeason,
    });
  }, [fixtures, selectedTeam, selectedSeason]);

  /* ========================= 6. PLAYER STATS ========================= */
  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayerId || !selectedTeamId || !selectedSeason) return null;

    return getSeasonPlayerStats({
      fixtures,
      // 🧼 FIX: Clear the "TEAM-" prefix out of the query target key
      teamId: normalize(selectedTeamId),
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
              setSelectedPlayerId(null);
            }}
            style={[
              styles.selectorCard,
              normalize(selectedTeamId || "") === normalize(team.id) &&
                styles.selectorCardSelected,
            ]}
          >
            <Text
              style={[
                styles.selectorText,
                normalize(selectedTeamId || "") === normalize(team.id) &&
                  styles.selectorTextSelected,
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
        onUpgrade={() => setShowSubscriptionModal(true)}
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
