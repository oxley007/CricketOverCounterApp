// src/screens/FixturesScreen.tsx

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
import { listenAndMergeFixture } from "../services/fixtureSyncService";
import { getAllFixtures } from "../services/sqliteService";

import FixtureCard from "../components/FixtureCard";
import SubscriptionList from "../components/iap/SubscriptionList";
import { Fixture, useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { useLiveStore } from "../state/liveStore";

import FixtureSummaryModal from "../components/FixtureSummaryModal";
import BallCounterFixtureCard from "../components/BallCounterFixtureCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FixturesScreen() {
  const insets = useSafeAreaInsets();
  const { teams } = useTeamStore();
  const fixturesRevision = useFixtureStore((s) => s.fixturesRevision);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllFixtures();
        console.log(`📦 SQLite fixtures count: ${data.length}`);
        if (!cancelled) setFixtures(data);
      } catch (err) {
        console.warn(
          "⚠️ Failed to load fixtures list from SQLite in FixturesScreen:",
          err,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixturesRevision]);

  const teamCodesSupporter = useLiveStore((s) => s.teamCodesSupporter);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const proUnlocked = useMatchStore((s) => s.proUnlocked); // for ball counter
  const proScorebookUnlocked = useMatchStore((s) => s.proUnlockedScorebook); // for scorebook

  const livePro = useLiveStore((s) => s.livePro);
  const liveProViewer = useLiveStore((s) => s.liveProViewer);
  const isLiveProUnlocked = livePro || liveProViewer; // Combined helper

  const startModal = useStartModalStore();

  console.log(
    useLiveStore.getState().teamCodesSupporter,
    " check teamCodesSupporter here.",
  );

  // Helper utility to safely compare local and remote team identifiers
  const normalize = (id: string) => id?.replace("TEAM-", "").toLowerCase();

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

  /*
  useEffect(() => {
    console.log("📦 Current Fixture Store:", JSON.stringify(fixtures, null, 2));
  }, [fixtures]);
  */

  useEffect(() => {
    fixtures.forEach((f) => {
      console.log(
        `Fixture ID: ${f.id} | Team ID: ${f.yourTeam?.id} | Season check: ${f.season}`,
      );
    });
  }, [fixtures]);

  useEffect(() => {
    const supporterCodes = teamCodesSupporter || [];
    if (supporterCodes.length === 0) return;

    console.log(
      `📡 [LIFECYCLE] Initialising live match channels for ${supporterCodes.length} teams.`,
    );

    const unsubscribes = supporterCodes.map((code) =>
      listenAndMergeFixture(code),
    );

    return () => {
      console.log("🛑 [LIFECYCLE] Disconnecting all live match channels.");
      unsubscribes.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, [teamCodesSupporter]);

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

    // 1. Add your managed teams ONLY if they have active fixtures/stats
    teams.forEach((t) => {
      const normalizedTeamId = normalize(t.id);

      const hasFixtures = fixtures.some(
        (f) =>
          normalize(f.yourTeam?.id || f.yourTeamId || "") === normalizedTeamId,
      );

      // Only add to the list if stats/fixtures exist for it
      if (hasFixtures) {
        uniqueTeams.set(normalizedTeamId, { ...t, isSupporter: false });
      }
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
  }, [teams, supporterTeamNames, fixtures]); // 👈 Added 'fixtures' back to dependency array

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
        .map((f) => {
          console.log("Fixture item:", f);
          return f;
        })
    );
  }, [fixtures, selectedTeamId, selectedSeason]);

  //console.log(JSON.stringify(fixtures[0]), "fixtures have a loo in here [0]?");

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Fixtures</Text>

        {/* TEAM SELECT */}
        <View style={styles.selectorRow}>
          {yourTeams.map((team) => {
            // Updated to use the normalize function for safer ID comparison
            const isSelected =
              normalize(selectedTeamId || "") === normalize(team.id);
            return (
              <Pressable
                key={team.id}
                onPress={() => {
                  setSelectedTeamId(team.id);
                  setSelectedSeason(null);
                  // Kept omitted player reset if fixtures page doesn't use it
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
                      ? styles.selectorTextSelected // Fixed style name here
                      : styles.textUnselected, // Fixed style name here
                  ]}
                >
                  {team.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.separator} />

        {/* SEASON SELECT */}
        <View style={styles.seasonContainer}>
          {/* Header Row with Label and Settings Icon */}
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
              {/* 
        Using a standard text character or an icon library like 
        @expo/vector-icons (MaterialIcons 'settings') is recommended here.
      */}
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
                    pressed && !isSelected && styles.pillCardActive, // HTML only scales the unselected item
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

        {/* FIXTURE LIST */}
        <FlatList
          data={sortedSeasonFixtures}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => {
            const innings: any[] = Array.isArray(item.innings)
              ? item.innings
              : Object.values(item.innings || {});

            // 1️⃣ ORIGINAL PRO LOGIC PRESERVED: Only index 0 is free, others require pro
            const isFreeFixture = index === 0;
            const isUnlocked = isFreeFixture || isLiveProUnlocked;

            // Check if match is incomplete / placeholder style using your actual raw data keys
            const isIncomplete = !item.completed;

            if (isIncomplete) {
              return (
                <View style={styles.incompleteCard}>
                  <View style={styles.mb4}>
                    <Text style={styles.dateText}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-GB")
                        : "12/06/2026"}
                    </Text>
                  </View>
                  {/* Animated pulse layout placeholder */}
                  <View style={styles.pulsePlaceholder} />
                </View>
              );
            }

            // 2️⃣ BALL COUNTER LOGIC FIXED: Check if any innings records contain valid batting entries
            const isBallCounterFixture =
              innings.length > 0 &&
              innings.every(
                (i: any) => !i.battingEntries || i.battingEntries.length === 0,
              );

            // 3️⃣ ORIGINAL PRO LOGIC PRESERVED: Determine if it is a Pro Locked view
            const isLocked =
              !isUnlocked && !proScorebookUnlocked && !proUnlocked;

            if (isLocked) {
              return (
                <View style={[styles.glassCard, styles.proCardBorder]}>
                  {/* Large Background Lock Icon Asset */}
                  <View style={styles.lockIconAbsolute}>
                    <Text style={styles.lockIconText}>🔒</Text>
                  </View>

                  <View style={[styles.flexRowJustify, styles.mb4]}>
                    <Text style={styles.dateText}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-GB")
                        : "15/06/2026"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.headlineMd,
                      styles.textOnSurface,
                      styles.mb6,
                    ]}
                  >
                    vs {item.oppositionTeam?.name}
                  </Text>

                  <View style={styles.zIndex10}>
                    <Pressable
                      onPress={() => setShowSubscriptionModal(true)}
                      style={({ pressed }) => [
                        styles.proButton,
                        pressed && styles.proButtonActive,
                      ]}
                    >
                      <Text style={styles.proButtonTextBold}>
                        Upgrade to Pro
                      </Text>
                      <Text style={styles.proButtonTextSub}>
                        to see innings scores and result
                      </Text>
                    </Pressable>

                    <View style={[styles.flexRowJustify, styles.mt4]}>
                      <View style={styles.capsBadge}>
                        <Text style={styles.capsBadgeText}>
                          BALL COUNTER MATCH
                        </Text>
                      </View>
                      <Text style={styles.premiumIcon}>⭐</Text>
                    </View>
                  </View>
                </View>
              );
            }

            // --- DATA PARSING FOR STANDARD LAYOUT ---
            const getTeamSummary = (teamId: string) => {
              const teamInnings = innings.find(
                (i: any) => i.battingTeamId === teamId,
              );
              if (!teamInnings) return "DNB";
              return `${teamInnings.totalRuns || 0}/${teamInnings.totalWickets || 0}`;
            };

            const homeSummary = getTeamSummary(item.yourTeam?.id);
            const awaySummary = getTeamSummary(item.oppositionTeam?.id);
            const resultMargin = item.result?.margin || "No Result";

            // Standard Free / Unlocked Card Layout
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.glassCard,
                  pressed && styles.glassCardPressed,
                ]}
                onPress={() => {
                  if (!isUnlocked && !proScorebookUnlocked && !proUnlocked) {
                    setShowSubscriptionModal(true);
                    return;
                  }
                  // Do not open modal if it is a basic ball counter match
                  if (isBallCounterFixture) return;

                  useFixtureStore.setState({ currentFixture: item });
                  setSelectedFixture(item);
                  setModalVisible(true);
                }}
              >
                {/* Card Header */}
                <View style={[styles.flexRowJustify, styles.mb4]}>
                  <Text style={styles.dateText}>
                    {item.date
                      ? new Date(item.date).toLocaleDateString("en-GB")
                      : "15/06/2026"}
                  </Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>COMPLETED</Text>
                  </View>
                </View>

                {/* Card Title */}
                <Text
                  style={[
                    styles.headlineMd,
                    styles.textPrimaryContainer,
                    styles.mb4,
                  ]}
                >
                  vs {item.oppositionTeam?.name}
                </Text>

                {/* 👇 New Addition: Shows a simple label if it is a Ball Counter game */}
                {isBallCounterFixture && (
                  <View
                    style={[
                      styles.capsBadge,
                      styles.mb4,
                      { alignSelf: "flex-start" },
                    ]}
                  >
                    <Text style={styles.capsBadgeText}>BALL COUNTER MATCH</Text>
                  </View>
                )}

                {/* Innings Scores Rows mapped cleanly from raw schema */}
                <View style={styles.mb4}>
                  <View style={[styles.flexRowJustify, styles.py1]}>
                    <Text style={styles.textOnSurface}>
                      {item.yourTeam?.name || "Your Team"}
                    </Text>
                    <Text style={styles.scoreTextWhite}>{homeSummary}</Text>
                  </View>
                  <View style={[styles.flexRowJustify, styles.py1]}>
                    <Text style={styles.textOnSurfaceVariant}>
                      {item.oppositionTeam?.name || "Opposition Team"}
                    </Text>
                    <Text style={styles.scoreTextSurface}>{awaySummary}</Text>
                  </View>
                </View>

                {/* Dynamic Margin Alert Banner */}
                <View style={styles.resultBanner}>
                  <Text style={styles.resultBannerText}>{resultMargin}</Text>
                </View>

                {/* Conditional Notice: Hidden if it is a ball counter match */}
                {!isBallCounterFixture && (
                  <View style={styles.tapNoticeContainer}>
                    <Text style={styles.tapNoticeIcon}>👆</Text>
                    <Text style={styles.tapNoticeText}>
                      (Tap for Scorecard)
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </ScrollView>

      {/* Global CTA Container */}
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
  container: { flex: 1, padding: 16, backgroundColor: "#0b1326" },
  title: {
    // Matches font-headline-lg and text-headline-lg configuration
    //fontFamily: "Plus Jakarta Sans",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",

    // Matches text-on-background color
    color: "#dae2fd",

    // Matches mb-6 (6 * 4px = 24px) or spacing.stack-lg (24px)
    marginBottom: 24,
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
  seasonLabel: {
    color: "#ffffff", // Clean white color
    fontSize: 20, // Universal medium text size
    fontWeight: "500", // Medium text weight for premium legibility
    marginBottom: 8, // Padding space before the selection options
    paddingHorizontal: 4, // Alignment breathing room
  },

  selectorCard: {
    flex: 1,
    paddingVertical: 12, // Matches py-3 (3 * 4px = 12px)
    paddingHorizontal: 16, // Matches px-4 (4 * 4px = 16px)
    borderRadius: 12, // Matches rounded-xl (0.75rem = 12px)
    alignItems: "center",
    justifyContent: "center",
  },
  // Active selection button state
  selectorCardSelected: {
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    // Shadow implementation matching shadow-lg shadow-secondary-container/20
    ...Platform.select({
      ios: {
        shadowColor: "#6f00be",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Inactive button state

  // Micro-interaction state

  textSelected: {
    color: "#d6a9ff", // Matches text-on-secondary-container
  },

  seasonContainer: {
    marginBottom: 32, // Matches mb-8 (8 * 4px = 32px)
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12, // Matches mb-3 (3 * 4px = 12px)
  },
  labelCaps: {
    // Matches font-label-caps and text-label-caps
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 12 * 0.08, // Matches letterSpacing: "0.08em"
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
  settingsButton: {
    padding: 4, // Matches p-1 (1 * 4px = 4px)
    borderRadius: 9999, // Matches rounded-full
  },
  settingsButtonActive: {
    backgroundColor: "rgba(0, 194, 243, 0.1)", // Matches hover/active bg-primary-container/10
  },
  settingsIcon: {
    fontSize: 20, // Matches text-[20px]
    color: "#00c2f3", // Matches text-primary-container
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    // Note: The HTML relies on ml-2 for spacing between items.
    // In React Native, gap is much cleaner for dynamic maps.
    gap: 8,
  },
  pillCard: {
    paddingVertical: 8, // Matches py-2 (2 * 4px = 8px)
    paddingHorizontal: 24, // Matches px-6 (6 * 4px = 24px)
    borderRadius: 9999, // Matches rounded-full
    alignItems: "center",
    justifyContent: "center",
  },
  pillCardSelected: {
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    // Tailwind "shadow-inner" simulated via subtle elevation/opacity changes
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  pillCardUnselected: {
    backgroundColor: "#222a3d", // Matches bg-surface-container-high
  },
  pillCardActive: {
    transform: [{ scale: 0.95 }], // Matches active:scale-95
  },
  pillText: {
    // Matches font-mono-stats and text-mono-stats
    fontFamily: "Geist",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#d6a9ff", // Matches text-on-secondary-container
  },
  pillTextUnselected: {
    color: "#dae2fd", // Matches text-on-surface
  },

  listContainer: {
    paddingHorizontal: 16, // Matches px-container-padding-mobile
    gap: 12, // Replaces space-y-stack-md (12px)
  },
  // Base structural classes for Glassmorphism styles
  glassCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)", // glass-card styling
    borderRadius: 12, // Matches rounded-xl
    padding: 20, // Matches p-5 (5 * 4px = 20px)
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
  },
  glassCardPressed: {
    borderColor: "rgba(127, 218, 255, 0.3)", // Matches hover:border-primary/30
    transform: [{ scale: 0.99 }],
  },
  proCardBorder: {
    borderColor: "rgba(221, 183, 255, 0.2)", // Matches border-secondary/20
  },
  // Incomplete placeholder block layout
  incompleteCard: {
    backgroundColor: "#131b2e", // Matches bg-surface-container-low
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3d494e", // Matches border-outline-variant
    borderStyle: "dashed",
    opacity: 0.6,
  },
  pulsePlaceholder: {
    height: 24, // Matches h-6
    width: "75%", // Matches w-3/4
    backgroundColor: "#2d3449", // Matches bg-surface-variant
    borderRadius: 4,
  },
  // Absolute design elements
  lockIconAbsolute: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  lockIconText: {
    fontSize: 64, // Matches text-[64px]
    color: "#ddb7ff",
    opacity: 0.2, // Matches opacity-20
  },
  // Component specific layouts
  flexRowJustify: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zIndex10: {
    zIndex: 10,
  },
  // Typography components
  dateText: {
    fontFamily: "Geist", // Matches font-mono-stats
    fontSize: 14,
    color: "#bcc8cf", // Matches text-on-surface-variant
    opacity: 0.8,
  },
  headlineMd: {
    fontFamily: "Plus Jakarta Sans", // Matches font-headline-md
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  scoreTextWhite: {
    fontFamily: "Geist",
    fontSize: 18, // Matches text-lg
    fontWeight: "700",
    color: "#ffffff",
  },
  scoreTextSurface: {
    fontFamily: "Geist",
    fontSize: 18,
    fontWeight: "700",
    color: "#dae2fd", // Matches text-on-surface
  },
  // Text state changes
  textPrimaryContainer: {
    color: "#00c2f3", // Matches text-primary-container
  },
  textOnSurface: {
    color: "#dae2fd", // Matches text-on-surface
  },
  textOnSurfaceVariant: {
    color: "#bcc8cf", // Matches text-on-surface-variant
  },
  // Badges & Actions layouts
  completedBadge: {
    backgroundColor: "rgba(127, 218, 255, 0.1)", // Matches bg-primary/10
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  completedBadgeText: {
    color: "#7fdaff", // Matches text-primary
    fontSize: 10, // Matches text-[10px]
    fontWeight: "700",
    letterSpacing: 1,
  },
  resultBanner: {
    backgroundColor: "rgba(6, 14, 32, 0.5)", // Matches bg-surface-container-lowest/50
    borderRadius: 8, // Matches rounded-lg
    padding: 12, // Matches p-3
    borderLeftWidth: 2,
    borderLeftColor: "#7fdaff", // Matches border-primary
    marginBottom: 12, // Matches mb-3
  },
  resultBannerText: {
    color: "#7fdaff", // Matches text-primary
    fontSize: 14, // Matches text-sm
    fontWeight: "600",
  },
  tapNoticeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8, // Matches pt-2
  },
  tapNoticeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tapNoticeText: {
    color: "#bcc8cf",
    fontSize: 12, // Matches text-xs
    opacity: 0.6,
  },
  // Pro Button configuration
  proButton: {
    width: "100%",
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    padding: 16, // Matches p-4
    borderRadius: 12, // Matches rounded-xl
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#6f00be",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  proButtonActive: {
    transform: [{ scale: 0.98 }], // Matches active:scale-[0.98]
  },
  proButtonTextBold: {
    fontWeight: "700",
    color: "#d6a9ff", // Matches text-on-secondary-container
    marginBottom: 4,
  },
  proButtonTextSub: {
    fontSize: 12, // Matches text-xs
    color: "#d6a9ff",
    opacity: 0.9,
  },
  capsBadge: {
    backgroundColor: "#2d3449", // Matches bg-surface-container-highest
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  capsBadgeText: {
    fontFamily: "Geist", // Matches font-label-caps
    fontSize: 10,
    fontWeight: "600",
    color: "#bcc8cf",
  },
  premiumIcon: {
    fontSize: 16,
    color: "#ddb7ff", // Matches text-secondary
  },
  // Generic structural utility spacers
  mb4: { marginBottom: 16 },
  mb6: { marginBottom: 24 },
  mt4: { marginTop: 16 },
  py1: { paddingVertical: 4 },
  ctaContainer: {
    paddingHorizontal: 16, // Matches px-container-padding-mobile (16px)
    marginTop: 40, // Matches mt-10 (10 * 4px = 40px)
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 16, // Matches py-4 (4 * 4px = 16px)
    paddingHorizontal: 24, // Matches px-6 (6 * 4px = 24px)
    borderRadius: 16, // Matches rounded-2xl (1rem = 16px)
    backgroundColor: "#6f00be", // Matches bg-secondary-container
    alignItems: "center",
    justifyContent: "center",
    // Shadow implementation matching shadow-xl + hover:shadow-secondary/20
    ...Platform.select({
      ios: {
        shadowColor: "#ddb7ff", // Color matching the secondary accent tint
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
    transform: [{ scale: 0.97 }], // Matches active:scale-[0.97]
  },
  ctaButtonText: {
    // Matches font-bold and body-lg styling configuration
    fontFamily: "Hanken Grotesk",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
    color: "#d6a9ff", // Matches text-on-secondary-container
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
    elevation: 3, // Shadow for Android
    // Optional: Add shadow for iOS to match elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  // Active selection button state
  selectorCardSelected: {
    backgroundColor: "#c471ed", // Matches bg-secondary-container
    // Shadow implementation matching shadow-lg shadow-secondary-container/20
    ...Platform.select({
      ios: {
        shadowColor: "#6f00be",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  selectorCardUnselected: {
    // Keeps fallback background from selectorCard
  },
  selectorCardActive: {
    opacity: 0.7, // Visual feedback when tapped
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectorTextSelected: {
    color: "#fff", // White text when selected
  },
  textUnselected: {
    color: "#333", // Dark gray text when unselected
  },
});
