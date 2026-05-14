// src/screens/FixturesScreen.tsx

import { router } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { listenAndMergeFixture } from "../services/fixtureSyncService";

import FixtureCard from "../components/FixtureCard";
import SubscriptionList from "../components/iap/SubscriptionList";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { useLiveStore } from "../state/liveStore";

import FixtureSummaryModal from "../components/FixtureSummaryModal";
import BallCounterFixtureCard from "../components/BallCounterFixtureCard";

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

  console.log(
    useLiveStore.getState().teamCodesSupporter,
    " check teamCodesSupporter here.",
  );

  // src/screens/FixturesScreen.tsx

  useEffect(() => {
    const supporterCodes = useLiveStore.getState().teamCodesSupporter || [];
    if (supporterCodes.length === 0) return;

    const unsubscribes = supporterCodes.map((code) =>
      listenAndMergeFixture(code),
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []); // Runs on mount

  useEffect(() => {
    console.log("📦 Current Fixture Store:", JSON.stringify(fixtures, null, 2));
  }, [fixtures]);

  useEffect(() => {
    fixtures.forEach((f) => {
      console.log(
        `Fixture ID: ${f.id} | Team ID: ${f.yourTeam?.id} | Season check: ${f.season}`,
      );
    });
  }, [fixtures]);

  const openGameModeModal = () => {
    router.replace("/");
    setTimeout(() => startModal.reset(), 100);
  };

  /* =========================
     DERIVED TEAMS
  ========================= */

  /*
  const yourTeams = useMemo(() => {
    const map = new Map<string, boolean>();

    fixtures.forEach((f) => {
      const teamId = f.yourTeamId ?? f.yourTeam?.id;
      if (teamId) map.set(teamId, true);
    });

    return teams.filter((t) => map.has(t.id));
  }, [fixtures, teams]);
  */

  /* ========================= DERIVED TEAMS ========================= */
  const supporterTeamNames = useLiveStore((s) => s.supporterTeamNames); // Get reactive state

  const yourTeams = useMemo(() => {
    const supporterCodes = useLiveStore.getState().teamCodesSupporter || [];
    const uniqueTeams = new Map();

    // 1. Add your managed teams
    teams.forEach((t) => {
      uniqueTeams.set(t.id.toLowerCase(), { ...t, isSupporter: false });
    });

    // 2. Add supporter teams using names from liveStore
    supporterCodes.forEach((code) => {
      const normalizedId = code.toLowerCase();
      if (!uniqueTeams.has(normalizedId)) {
        uniqueTeams.set(normalizedId, {
          id: code,
          name: supporterTeamNames[code] || code, // This now reacts to store updates
          isSupporter: true,
        });
      }
    });

    return Array.from(uniqueTeams.values());
  }, [teams, supporterTeamNames]); // 👈 'fixtures' removed, 'supporterTeamNames' added

  /* =========================
     SEASONS
  ========================= */

  const seasons = useMemo(() => {
    if (!selectedTeamId) return [];

    // Helper to strip "TEAM-" and lowercase
    const normalize = (id: string) => id?.replace("TEAM-", "").toLowerCase();
    const targetId = normalize(selectedTeamId);

    const filteredSeasons = fixtures
      .filter((f) => {
        const fixtureTeamId = normalize(f.yourTeam?.id || f.yourTeamId || "");
        return fixtureTeamId === targetId;
      })
      .map((f) => f.season)
      .filter(Boolean);

    return Array.from(new Set(filteredSeasons)).sort().reverse();
  }, [fixtures, selectedTeamId]);

  /* ========================= FIXTURES ========================= */
  /* ========================= FIXTURES ========================= */
  const sortedSeasonFixtures = useMemo(() => {
    if (!selectedTeamId || !selectedSeason) return [];

    const normalize = (id: string) => id?.replace("TEAM-", "").toLowerCase();
    const targetId = normalize(selectedTeamId);

    return (
      fixtures
        .filter((f) => {
          const fixtureTeamId = normalize(f.yourTeam?.id || f.yourTeamId || "");
          return fixtureTeamId === targetId && f.season === selectedSeason;
        })
        // 👇 Re-added the sort logic here
        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
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
        data={sortedSeasonFixtures}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const innings = Object.values(item.innings || {});

          const isBallCounterFixture = innings.every(
            (i: any) => !i.battingEntries || i.battingEntries.length === 0,
          );

          if (isBallCounterFixture) {
            return (
              <BallCounterFixtureCard
                fixture={item}
                isFreeFixture={index === 0}
                onUpgradePress={() => setShowSubscriptionModal(true)}
              />
            );
          }

          return (
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
          );
        }}
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
