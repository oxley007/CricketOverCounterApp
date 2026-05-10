// src/screens/FixturesScreen.tsx

import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import FixtureCard from "../components/FixtureCard";
import SubscriptionList from "../components/iap/SubscriptionList";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";

import FixtureSummaryModal from "../components/FixtureSummaryModal";

export default function FixturesScreen() {
  const { teams } = useTeamStore();
  const { fixtures } = useFixtureStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const proUnlocked = useMatchStore((s) => s.proUnlocked); // for ball counter
  const proScorebookUnlocked = useMatchStore((s) => s.proUnlockedScorebook); // for scorebook

  const startModal = useStartModalStore();

  const openGameModeModal = () => {
    router.replace("/");
    setTimeout(() => startModal.reset(), 100);
  };

  /* =========================
     DERIVED TEAMS
  ========================= */

  const yourTeams = useMemo(() => {
    const map = new Map<string, boolean>();

    fixtures.forEach((f) => {
      const teamId = f.yourTeamId ?? f.yourTeam?.id;
      if (teamId) map.set(teamId, true);
    });

    return teams.filter((t) => map.has(t.id));
  }, [fixtures, teams]);

  /* =========================
     SEASONS
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
     FIXTURES
  ========================= */

  const seasonFixtures = useMemo(() => {
    if (!selectedTeamId || !selectedSeason) return [];

    return fixtures.filter(
      (f) =>
        (f.yourTeamId ?? f.yourTeam?.id) === selectedTeamId &&
        f.season === selectedSeason,
    );
  }, [fixtures, selectedTeamId, selectedSeason]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixtures</Text>

      {/* TEAM SELECT */}
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
            <Text style={styles.selectorText}>{team.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* SEASON SELECT */}
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
            <Text style={styles.selectorText}>{season}</Text>
          </Pressable>
        ))}
      </View>

      {/* FIXTURE LIST */}
      <FlatList
        data={seasonFixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FixtureCard
            fixture={item}
            isFreeFixture={index === 0}
            onPress={() => {
              const isFreeFixture = index === 0;

              if (!proScorebookUnlocked && !isFreeFixture) {
                setShowSubscriptionModal(true);
                return;
              }

              useFixtureStore.setState({ currentFixture: item });
              setSelectedFixture(item);
              setModalVisible(true);
            }}
          />
        )}
      />

      <View style={{ marginBottom: 16, marginTop: 16 }}>
        <Pressable style={styles.modalButton} onPress={openGameModeModal}>
          <Text style={styles.modalButtonText}>Back to Select Game Mode</Text>
        </Pressable>
      </View>

      <FixtureSummaryModal
        visible={modalVisible}
        fixture={selectedFixture}
        onClose={() => setModalVisible(false)}
      />

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
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  selectorRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  selectorCardSelected: {
    backgroundColor: "#c471ed",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
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
  modalButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 12,
    borderRadius: 2,
  },
});
