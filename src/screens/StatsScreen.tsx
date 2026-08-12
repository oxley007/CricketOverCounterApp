// src/screens/StatsScreen.tsx
import { router } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  ScrollView,
} from "react-native";
import SubscriptionList from "../components/iap/SubscriptionList";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { listenAndMergeFixture } from "../services/fixtureSyncService";
import { getAllFixtures, initDB } from "../services/sqliteService";
import { Fixture, useFixtureStore } from "../state/fixtureStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getSeasonPlayers,
  getSeasonPlayerStats,
  getSeasonTeamStats,
} from "../state/seasonStatsHelpers";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore, Team } from "../state/teamStore";
import { useLiveStore } from "../state/liveStore";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { teams } = useTeamStore();
  const fixturesRevision = useFixtureStore((s) => s.fixturesRevision);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"player" | "team">("player");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const startModal = useStartModalStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initDB();
        const loadedFixtures = await getAllFixtures();
        if (!cancelled) setFixtures(loadedFixtures);
      } catch (err) {
        console.warn("⚠️ Failed to load fixtures from SQLite:", err);
      } finally {
        if (!cancelled) setFixturesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fixturesRevision]);

  useEffect(() => {
    if (!selectedTeamId) return;

    console.log(
      `📡 [LIFECYCLE] Initialising live match sync channel for team: ${selectedTeamId}`,
    );

    // 1. Fire up the snapshot stream
    const unsubscribe = listenAndMergeFixture(selectedTeamId);

    // 2. Clean up memory and close the connection when they switch teams or leave the page
    return () => {
      if (typeof unsubscribe === "function") {
        console.log("🛑 [LIFECYCLE] Closing live sync channel.");
        unsubscribe();
      }
    };
  }, [selectedTeamId]);

  const openGameModeModal = () => {
    router.replace("/");
    setTimeout(() => startModal.reset(), 100);
  };

  // Helper utility to safely compare local and remote team identifiers
  const normalize = (id: string) => id?.replace("TEAM-", "").toLowerCase();

  /* ========================= 1. DERIVED TEAMS (MERGED) ========================= */
  const supporterTeamNames = useLiveStore((s) => s.supporterTeamNames);
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

  const yourTeams = useMemo(() => {
    const supporterCodes = useLiveStore.getState().teamCodesSupporter || [];
    const uniqueTeams = new Map();

    // 1. Add all your managed local teams ONLY if they have active fixtures/stats
    teams.forEach((t) => {
      const normalizedTeamId = normalize(t.id);

      // Look through the fixtures database to confirm this team has matched stats
      const hasFixtures = fixtures.some(
        (f) =>
          normalize(f.yourTeam?.id || f.yourTeamId || "") === normalizedTeamId,
      );

      // Only display the local managed team if stats/fixtures exist for it
      if (hasFixtures) {
        uniqueTeams.set(normalizedTeamId, { ...t, isSupporter: false });
      }
    });

    // 2. Merge in all data from liveViewTeams ONLY if they have active fixtures/stats
    const safeLiveTeams = liveViewTeams || [];
    safeLiveTeams.forEach((lt) => {
      const normalizedId = normalize(lt.id);
      const existing = uniqueTeams.get(normalizedId);

      // Check if this live supporter team has active fixtures/stats
      const hasFixtures = fixtures.some(
        (f) => normalize(f.yourTeam?.id || f.yourTeamId || "") === normalizedId,
      );

      // Condition: It's either an existing managed team OR a supporter team with active fixtures
      if (existing || hasFixtures) {
        uniqueTeams.set(normalizedId, {
          ...existing,
          ...lt,
          isSupporter: existing?.isSupporter ?? true,
          // 🚀 FORCE PLAYER IDs TO LOWERCASE: Map over incoming live players
          players: (lt.players ?? []).map((p) => ({
            ...p,
            id: (p.id || "").toLowerCase(),
          })),
        });
      }
    });

    // 3. Fallback check for supporter codes not yet fully loaded in liveViewTeams
    supporterCodes.forEach((code) => {
      const normalizedId = normalize(code);

      // Check if this fallback supporter team has active fixtures/stats
      const hasFixtures = fixtures.some(
        (f) => normalize(f.yourTeam?.id || f.yourTeamId || "") === normalizedId,
      );

      // Only insert the fallback if it isn't listed yet AND it actually has fixtures
      if (!uniqueTeams.has(normalizedId) && hasFixtures) {
        uniqueTeams.set(normalizedId, {
          id: code,
          name: supporterTeamNames[code] || code,
          isSupporter: true,
          players: [],
        });
      }
    });

    return Array.from(uniqueTeams.values());
  }, [teams, supporterTeamNames, liveViewTeams, fixtures]); // ✨ Added fixtures to the dependency array

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
    // Look for this section inside your selectedTeam useMemo hook:
    fixtures
      .filter((f) => normalize(f.yourTeam?.id || "") === targetId)
      .forEach((f) => {
        // 🚀 CRITICAL RESILIENCY FIX: Handle Object-dictionary vs Array variations safely
        const safeInningsArray = Array.isArray(f.innings)
          ? f.innings
          : f.innings
            ? Object.values(f.innings) // Fallback if Firebase saved it as a map map key layout
            : [];

        safeInningsArray.forEach((inn: any) => {
          // 🚀 Added safety check for battingEntries as well
          const safeBattingEntries = Array.isArray(inn?.battingEntries)
            ? inn.battingEntries
            : [];

          safeBattingEntries.forEach((b: any) => {
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

  /* ========================= SELECT LIVE SELECTION STATES ========================= */
  //const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

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

  console.log(
    JSON.stringify(useLiveStore.getState().playerCodesSupporter),
    "check playerCodesSupporter",
  );

  console.log(
    JSON.stringify(yourTeams),
    "yourTeams need to check if it has player IDs.",
  );

  console.log(
    JSON.stringify(useLiveStore.getState().liveViewTeams),
    "liveViewTeams need to check if it has player IDs.",
  );

  console.log(
    JSON.stringify(fixtures),
    "fixtures need to check if it has player IDs.",
  );

  if (fixturesLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Season Stats</Text>
        <Text style={{ color: "#dae2fd" }}>Loading fixtures...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Season Stats</Text>

        {/* TEAM SELECT */}
        <View style={styles.selectorRow}>
          {yourTeams.map((team) => {
            const isSelected =
              normalize(selectedTeamId || "") === normalize(team.id);
            return (
              <Pressable
                key={team.id}
                onPress={() => {
                  setSelectedTeamId(team.id);
                  setSelectedSeason(null);
                  setSelectedPlayerId(null);
                }}
                style={({ pressed }) => [
                  styles.selectorCard,
                  isSelected
                    ? styles.selectorCardSelected
                    : styles.selectorCardUnselected,
                  pressed && styles.selectorCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    isSelected
                      ? styles.selectorTextSelected
                      : styles.textUnselected, // Fixed style names here
                  ]}
                >
                  {team.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Separator matches design background to cleanly space items if gap isn't used */}
        <View style={styles.separator} />

        {/* ================= SEASON SELECT ================= */}
        <View style={styles.seasonContainer}>
          {/* Header Row with Label & Settings Button matching original design specs */}
          <View style={styles.headerRow}>
            <Text style={styles.labelCaps}>SELECT SEASON:</Text>
            <Pressable
              onPress={() => {
                /* Handle settings press */
              }}
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.settingsButtonActive,
              ]}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
          </View>

          {/* Season Pills Row */}
          <View style={styles.pillsRow}>
            {seasons.map((season) => {
              const isSelected = selectedSeason === season;
              return (
                <Pressable
                  key={season}
                  onPress={() => setSelectedSeason(season)}
                  style={({ pressed }) => [
                    styles.pillCard,
                    isSelected
                      ? styles.pillCardSelected
                      : styles.pillCardUnselected,
                    pressed && !isSelected && styles.pillCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected
                        ? styles.pillTextSelected
                        : styles.pillTextUnselected,
                    ]}
                  >
                    {season}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.separator} />

        {/* ================= TEAM STATS BUTTON ================= */}
        {selectedTeam && selectedSeason && (
          <Pressable
            onPress={() => {
              setModalType("team");
              setModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.statsCardContainer,
              pressed ? styles.statsCardPressed : styles.statsCardUnpressed,
            ]}
          >
            {/* Left-side item content container */}
            <View style={styles.statsCardLeftRow}>
              {/* Icon Badge Container rounded-full */}
              <View style={styles.statsIconBadge}>
                {/* Recommended icon usage fallback for standard vector components */}
                <Text style={styles.statsIconText}>📈</Text>
              </View>

              {/* Stacked Vertical Labels block */}
              <View style={styles.statsTextColumn}>
                <Text style={styles.statsTextTitle}>
                  {selectedTeam.name} - Team Stats
                </Text>
                <Text style={styles.statsTextSub}>SEASON SUMMARY</Text>
              </View>
            </View>

            {/* Right-side action disclosure chevron */}
            <View style={styles.statsCardRightRow}>
              <Text style={styles.chevronIconText}>❯</Text>
            </View>
          </Pressable>
        )}

        {/* ================= PLAYER LIST ================= */}
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playerListContainer}
          // Renders the section headline once at the top of the list safely
          ListHeaderComponent={() => (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabelCaps}>INDIVIDUAL STATS:</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedPlayerId(item.id);
                setModalType("player");
                setModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.playerCardContainer,
                pressed ? styles.playerCardPressed : styles.playerCardUnpressed,
              ]}
            >
              {/* Left side: Avatar badge + Player identity text */}
              <View style={styles.playerCardLeftRow}>
                <View style={styles.playerAvatarBadge}>
                  {/* Default user silhouette emoji/icon asset indicator */}
                  <Text style={styles.playerAvatarText}>👤</Text>
                </View>
                <View style={styles.playerTextColumn}>
                  <Text style={styles.playerNameText}>{item.name}</Text>
                </View>
              </View>

              {/* Right side: Action chevron indicator */}
              <View style={styles.playerCardRightRow}>
                <Text style={styles.playerChevronIcon}>❯</Text>
              </View>
            </Pressable>
          )}
        />
      </ScrollView>

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

      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: Math.max(insets.bottom, 16) }, // Dynamically respects notches but enforces a 16px minimum
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonActive,
          ]}
          onPress={openGameModeModal}
        >
          <Text style={styles.ctaButtonText}>Back to Select Game Mode</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: "#0b1326" },
  title: {
    fontFamily: "Plus Jakarta Sans", // Matches font-headline-lg
    fontSize: 32, // Matches text-headline-lg
    lineHeight: 40,
    fontWeight: "700",
    color: "#dae2fd", // Matches text-on-background color
    marginBottom: 24, // Matches mb-6 (6 * 4px)
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows items to move to the next line
    marginBottom: 0,
  },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8, // Horizontal spacing between cards
    marginBottom: 8, // Vertical spacing when wrapped
    elevation: 3,
  },
  selectorCardSelected: {
    backgroundColor: "#c471ed",
  },
  selectorCardUnselected: {
    // Optional: add explicit unselected styles here if needed
  },
  selectorCardActive: {
    opacity: 0.7, // Provides visual feedback when tapped
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectorTextSelected: {
    color: "#fff",
  },
  textUnselected: {
    color: "#333",
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

  ctaContainer: {
    paddingHorizontal: 16, // Matches px-container-padding-mobile (16px)
    marginTop: 40, // Matches mt-10 (40px)
    backgroundColor: "#0b1326", // Matches design system main background
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#6f00be",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#ddb7ff",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  ctaButtonActive: {
    transform: [{ scale: 0.97 }],
  },
  ctaButtonText: {
    fontFamily: "Hanken Grotesk",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
    color: "#d6a9ff",
  },

  textSelected: {
    color: "#d6a9ff", // Matches text-on-secondary-container
  },

  // --- Season Selector Styles ---
  seasonContainer: {
    marginBottom: 32, // Matches mb-8 (32px)
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12, // Matches mb-3 (12px)
  },
  labelCaps: {
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 12 * 0.08,
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
  settingsButton: {
    padding: 4, // Matches p-1 (4px)
    borderRadius: 9999,
  },
  settingsButtonActive: {
    backgroundColor: "rgba(0, 194, 243, 0.1)", // Matches bg-primary-container/10
  },
  settingsIcon: {
    fontSize: 20,
    color: "#00c2f3", // Matches text-primary-container
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillCard: {
    paddingVertical: 8, // Matches py-2 (8px)
    paddingHorizontal: 24, // Matches px-6 (24px)
    borderRadius: 9999,
  },
  pillCardSelected: {
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  pillCardUnselected: {
    backgroundColor: "#222a3d", // Matches bg-surface-container-high
  },
  pillCardActive: {
    transform: [{ scale: 0.95 }],
  },
  pillText: {
    fontFamily: "Geist",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#d6a9ff",
  },
  pillTextUnselected: {
    color: "#dae2fd",
  },

  // --- Structure Layout Elements ---
  separator: {
    height: 1,
    backgroundColor: "#2d3449", // Matches border-outline-variant/surface-variant
    //marginVertical: 16,
  },
  statsCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16, // Matches p-4 (4 * 4px = 16px)
    borderRadius: 12, // Matches rounded-xl (12px)
    borderWidth: 1,
    borderColor: "#3d494e", // Matches border-outline-variant
    //marginHorizontal: 16, // Centers matching the standard layouts mobile layout margins
    marginBottom: 16,
  },
  statsCardUnpressed: {
    backgroundColor: "#131b2e", // Matches bg-surface-container-low
  },
  statsCardPressed: {
    backgroundColor: "#222a3d", // Matches hover:bg-surface-container-high / active-scale
    transform: [{ scale: 0.98 }],
  },
  statsCardLeftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsIconBadge: {
    width: 40, // Matches w-10 (40px)
    height: 40, // Matches h-10 (40px)
    borderRadius: 9999, // Matches rounded-full
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12, // Matches space-x-stack-md (12px)
  },
  statsIconText: {
    fontSize: 18,
    color: "#d6a9ff", // Matches text-on-secondary-container
  },
  statsTextColumn: {
    flexDirection: "column",
  },
  statsTextTitle: {
    fontFamily: "Hanken Grotesk", // Matches font-body-md
    fontSize: 16, // Matches text-body-md (16px)
    lineHeight: 24,
    fontWeight: "600", // Matches font-semibold
    color: "#dae2fd", // Matches text-on-surface
  },
  statsTextSub: {
    fontFamily: "Geist", // Matches font-label-caps
    fontSize: 12, // Matches text-label-caps (12px)
    lineHeight: 16,
    letterSpacing: 12 * 0.08, // Matches tracking parameters
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
    marginTop: 2,
  },
  statsCardRightRow: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  chevronIconText: {
    fontSize: 16,
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
  playerListContainer: {
    paddingHorizontal: 16, // Adapts list edges to container margins
    gap: 4, // Matches gap-stack-sm (4px)
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#3d494e", // Matches border-outline-variant
    paddingBottom: 8, // Matches pb-2 (2 * 4px = 8px)
    marginBottom: 12, // Separates the header stack from item cards cleanly
    marginTop: 24, // Spaces this block apart from upper grid elements
  },
  sectionLabelCaps: {
    fontFamily: "Geist", // Matches font-label-caps
    fontSize: 12, // Matches text-label-caps (12px)
    lineHeight: 16,
    letterSpacing: 12 * 0.08,
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
  playerCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16, // Matches p-4 (4 * 4px = 16px)
    borderRadius: 12, // Matches rounded-xl (12px)
    borderWidth: 1,
    borderColor: "#3d494e", // Matches border-outline-variant
  },
  playerCardUnpressed: {
    backgroundColor: "#131b2e", // Matches bg-surface-container-low
  },
  playerCardPressed: {
    backgroundColor: "#222a3d", // Matches hover:bg-surface-container-high / active-scale
    transform: [{ scale: 0.98 }],
  },
  playerCardLeftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerAvatarBadge: {
    width: 40, // Matches w-10 (40px)
    height: 40, // Matches h-10 (40px)
    borderRadius: 9999, // Matches rounded-full
    backgroundColor: "#2d3449", // Matches bg-surface-container-highest
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12, // Matches space-x-stack-md (12px)
  },
  playerAvatarText: {
    fontSize: 16,
    color: "#bcc8cf", // Matches text-on-surface-variant inside asset
  },
  playerTextColumn: {
    flexDirection: "column",
  },
  playerNameText: {
    fontFamily: "Hanken Grotesk", // Matches font-body-md
    fontSize: 16, // Matches text-body-md (16px)
    lineHeight: 24,
    fontWeight: "600", // Matches font-semibold
    color: "#dae2fd", // Matches text-on-surface
  },
  playerCardRightRow: {
    justifyContent: "center",
  },
  playerChevronIcon: {
    fontSize: 16,
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
});
