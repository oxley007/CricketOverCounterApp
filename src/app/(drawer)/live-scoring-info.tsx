// app/(drawer)/live-scoring-info.tsx

import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { isRevenueCatAvailable, getOfferings } from "@/src/services/revenuecat";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import SubscriptionList from "../../components/iap/SubscriptionList";
import { useTeamStore, type Team } from "../../state/teamStore";
import { useMatchStore } from "../../state/matchStore";
import { useGameStore } from "../../state/gameStore";
import { useStartModalStore } from "../../state/startModalStore";
import {
  createPublicTeam,
  updatebaseRunsData,
  updateCurrentGameData,
  updateLiveData,
  updatePublicTeamData,
} from "../../services/firestoreService";
import { useFixtureStore } from "../../state/fixtureStore";
import { useLiveStore, type LiveTeam } from "../../state/liveStore";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import AuthModal from "../../components/AuthModal";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTenantConfig } from "../../hooks/useTenantConfig";

export default function LiveScoringInfo() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { branding } = useTenantConfig();

  const { modeMessage: rawModeMessage } = useLocalSearchParams<{
    modeMessage: string;
  }>();
  const modeMessage = rawModeMessage || null;
  const isReminderMode = modeMessage === "reminder";

  const livePro = useLiveStore((state) => state.livePro);
  const [packages, setPackages] = useState<any[]>([]);
  const [fetchingPrices, setFetchingPrices] = useState(true);

  // Enforce authentication by disabling guest fallback
  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    allowGuest: false,
  });

  const [selectedTier, setSelectedTier] = useState<"coach" | "supporter">(
    "coach",
  );
  const state = useLiveStore.getState();

  console.log(
    "LIVE STATE CLEAN:",
    JSON.stringify(
      {
        liveConfigured: state.liveConfigured,
        livePro: state.livePro,
        teamCode: state.teamCode,
        teamId: state.teamId,
        playerIds: state.playerIds,
        teams: state.teams,
      },
      null,
      2,
    ),
  );

  useEffect(() => {
    async function loadPrices() {
      if (isRevenueCatAvailable()) {
        try {
          console.log("🏁 UI hook: Requesting offerings from RevenueCat...");
          const offerings = await getOfferings();

          if (!offerings) {
            console.warn(
              "⚠️ UI hook: offerings came back as null. Check SDK configuration logs.",
            );
            setPackages([]);
            return;
          }

          console.log(
            "📦 UI hook: Offerings object structure found:",
            Object.keys(offerings.all),
          );

          const currentOffering = offerings.current;
          if (!currentOffering) {
            console.error(
              "❌ UI hook: 'current' offering configuration is null. " +
                "Ensure you have set a Current Offering in the RevenueCat Dashboard under Entitlements > Offerings.",
            );
            setPackages([]);
            return;
          }

          const available = currentOffering.availablePackages || [];
          console.log(
            `✅ UI hook: Found ${available.length} packages within the current offering.`,
          );

          if (available.length === 0) {
            console.warn(
              "⚠️ UI hook: Current offering exists, but contains zero packages.",
            );
          }

          setPackages(available);
        } catch (err) {
          console.error(
            "❌ UI hook: Failed to fetch prices for info screen:",
            err,
          );
        } finally {
          setFetchingPrices(false);
        }
      } else {
        console.log("ℹ️ UI hook: RevenueCat is unavailable on this platform.");
        setFetchingPrices(false);
      }
    }
    loadPrices();
  }, []);

  const coachMonthlyPkg = packages.find(
    (pkg) => pkg.identifier === "rc_monthly_live",
  );
  const coachPrice = coachMonthlyPkg?.product.priceString || "$24.99/month";

  const supporterMonthlyPkg = packages.find(
    (pkg) => pkg.identifier === "rc_monthly_live_supporter",
  );
  const supporterPrice =
    supporterMonthlyPkg?.product.priceString || "$4.99/month";

  console.log(coachPrice, "coachPrice is wha?");

  const getButtonText = () => {
    if (livePro) return "Configure Live Scores";
    if (selectedTier === "coach") return "Choose your subscription";
    return "Configure Live Scores";
  };

  const handleConfigureLive = async () => {
    console.log(
      JSON.stringify(useFixtureStore.getState().currentFixture),
      "check in currentFixture in live info",
    );
    if (loading) return;

    // 1. Guard check: If Coach selected but not Pro, open payment modal immediately and stop execution
    if (selectedTier === "coach" && !livePro) {
      setShowSubscriptionModal(true);
      return;
    }

    // 2. Otherwise proceed with standard authentication and database configuration
    await requireAuth(async () => {
      setLoading(true);
      let success = false;

      try {
        // 1. Target the active current fixture directly
        const currentFixture = useFixtureStore.getState().currentFixture;

        if (!currentFixture || !currentFixture.yourTeam) {
          alert(
            "No active fixture or team selected. Please start a game first.",
          );
          return;
        }

        // 2. Prepare the fixtures array for backward compatibility with your creation services
        const fixtures = [currentFixture];

        // 3. Dynamically extract the single true ID you need to look up
        const targetTeamId = currentFixture.yourTeam.id;
        console.log(
          "🎯 Targeting Active Team ID from Current Fixture:",
          targetTeamId,
        );

        // 4. Find this specific team inside your global store
        const { teams: globalTeams } = useTeamStore.getState();
        const activeTeam = globalTeams.find(
          (t) => String(t.id) === String(targetTeamId),
        );
        console.log("🏪 Matching Team Found in Store:", activeTeam);

        // 5. Fallback cleanly to the fixture's own team object structure if missing from store
        const activeTeams = activeTeam
          ? [activeTeam]
          : [currentFixture.yourTeam];

        // 6. Gather remaining global store data for sync mutations
        const liveEvents = useMatchStore.getState().events;
        const liveTeams: LiveTeam[] = [];
        const { selectedMode } = useStartModalStore.getState();
        const currentGame = useGameStore.getState().currentGame;
        const { baseRuns } = useMatchStore.getState();

        const store = useLiveStore.getState();
        store.setLiveConfigured(true);

        for (const team of activeTeams) {
          const teamCode = await createPublicTeam(team, fixtures, liveEvents);
          if (!teamCode) continue;

          const liveTeam: LiveTeam = {
            teamId: team.id,
            teamCode,
            playerIds: (team.players ?? []).map((p) => p.id),
          };
          liveTeams.push(liveTeam);

          useTeamStore.getState().markLiveConfigured(team.id);

          await updatePublicTeamData(team.id, team);

          const teamFixture = fixtures.find((f) => f.yourTeam?.id === team.id);
          if (teamFixture) {
            await updateLiveData(team.id, {
              ...teamFixture,
              fixtureId: teamFixture.id,
              mode: selectedMode,
            });
          }
          await updateCurrentGameData(team.id, { ...currentGame });
          await updatebaseRunsData(team.id, { baseRuns });
        }

        if (liveTeams.length) {
          const store = useLiveStore.getState();
          store.setTeams(liveTeams);

          store.configureLive({
            teamId: liveTeams[0].teamId,
            teamCode: liveTeams[0].teamCode,
            playerIds: liveTeams[0].playerIds,
          });

          success = true;
        }

        console.log("do i get to here?");

        if (success) {
          console.log("in here woek? yaya?");
          router.push({
            pathname: "/live-scoring-instructions",
            params: { modeMessage: isReminderMode ? "reminder" : "" },
          });
        }
      } finally {
        if (!success) {
          useLiveStore.getState().setLiveConfigured(false);
        }
        setLoading(false);
      }
    });
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedScale,
              ]}
            >
              <MaterialIcons name="arrow-back" size={18} color="#7fdaff" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          {/* Title Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{branding.shortName} Live</Text>
              <Text style={styles.bannerSubtitle}>
                Keep supporters in the loop!
              </Text>
            </View>
            <View style={styles.bannerIconDecorator}>
              <MaterialIcons name="sensors" size={96} color="rgba(0,0,0,0.1)" />
            </View>
          </View>

          {/* Main Context Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Tap <Text style={styles.boldText}>Configure Live Scores</Text>{" "}
              below to sync this account to the cloud.
            </Text>
            <Text style={[styles.infoText, { marginTop: 16 }]}>
              You’ll then get a unique Team ID and Player IDs to share with your
              team group chat.
            </Text>
          </View>

          {!livePro ? (
            <>
              {/* How it works */}
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>HOW IT WORKS</Text>
              </View>

              <View style={styles.tierCard}>
                <Text style={styles.tierCardTitle}>FREE Tier</Text>
                <Text style={styles.tierCardBody}>
                  Supporters see live scores and overs (updated every 2 overs,
                  or instantly at innings end).
                </Text>
              </View>

              <View style={styles.tierCard}>
                <View style={styles.proIconContainer}>
                  <MaterialIcons
                    name="settings"
                    size={24}
                    color="rgba(188,200,207,0.4)"
                  />
                </View>
                <Text style={styles.tierCardTitle}>PRO Tier</Text>
                <Text style={styles.tierCardBody}>
                  Real-time, ball-by-ball updates. Includes full scorecards, run
                  rates, batter/bowler stats, and individual player performance.
                </Text>
              </View>

              {/* Pricing Tiers Selection */}
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>
                  CHOOSE WHO PAYS FOR PRO:
                </Text>
              </View>

              {/* Coach / Manager Pays */}
              <Pressable
                style={[
                  styles.radioCard,
                  selectedTier === "coach" && styles.radioCardChecked,
                ]}
                onPress={() => setSelectedTier("coach")}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedTier === "coach" && styles.radioOuterChecked,
                    ]}
                  >
                    {selectedTier === "coach" && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.radioTitle}>Coach / Manager Pays</Text>
                    <Text style={styles.radioDescription}>
                      A {coachPrice} subscription covers the entire team.
                    </Text>
                    <Text style={styles.radioSubDescription}>
                      All supporters get Pro access for free.
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Free / Supporter Pays */}
              <Pressable
                style={[
                  styles.radioCard,
                  selectedTier === "supporter" && styles.radioCardChecked,
                ]}
                onPress={() => setSelectedTier("supporter")}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedTier === "supporter" && styles.radioOuterChecked,
                    ]}
                  >
                    {selectedTier === "supporter" && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.radioTitle}>Free / Supporter Pays</Text>
                    <Text style={styles.radioDescription}>
                      Each individual can use the Free Tier*, or pay{" "}
                      {supporterPrice} for their own Pro access.
                    </Text>
                    <Text style={styles.radioNote}>
                      *Free Tier updates every 2 overs
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Note */}
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  Note: Each Player ID can be linked by up to 3 supporters
                  (e.g., two parents and a grandparent).
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.proAlertBanner}>
              <Text style={styles.proAlertText}>
                Pro Live purchased, you can now configure your live scoring
              </Text>
            </View>
          )}
        </ScrollView>

        {/* CTA Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Pressable
            style={[
              styles.footerButton,
              loading && styles.ctaButtonDisabled,
              ({ pressed }) => pressed && styles.pressedScale,
            ]}
            onPress={handleConfigureLive}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.footerButtonText}>{getButtonText()}</Text>
                {!livePro && selectedTier === "coach" ? (
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#ffffff"
                  />
                ) : null}
              </>
            )}
          </Pressable>
        </View>
      </View>

      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tier={selectedTier}
        isFromLiveConfig={true}
      />

      <AuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        subtitle="Login or signup for free to allow your live scores to be saved to the cloud"
        hideGuest={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1326", // Dark background match
  },
  header: {
    height: 64,
    backgroundColor: "#0b1326",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 140, // Space for fixed bottom CTA panel
    maxWidth: 672,
    alignSelf: "center",
    width: "100%",
  },
  backButtonContainer: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(127, 218, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#7fdaff",
    fontSize: 14,
    fontWeight: "600",
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  banner: {
    backgroundColor: "#7fdaff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: 16,
  },
  bannerContent: {
    zIndex: 10,
    alignItems: "center",
  },
  bannerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 30,
    fontWeight: "800",
    color: "#004c61",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: "Hanken Grotesk",
    fontSize: 18,
    fontWeight: "500",
    color: "#004c61",
    opacity: 0.9,
  },
  bannerIconDecorator: {
    position: "absolute",
    right: -16,
    bottom: -16,
  },
  infoCard: {
    backgroundColor: "#171f33",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  infoText: {
    fontFamily: "Hanken Grotesk",
    fontSize: 16,
    lineHeight: 24,
    color: "#dae2fd",
  },
  boldText: {
    fontWeight: "700",
  },
  pillBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(127, 218, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    marginBottom: 16,
    marginTop: 8,
  },
  pillBadgeText: {
    color: "#7fdaff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  tierCard: {
    backgroundColor: "#171f33",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    position: "relative",
  },
  proIconContainer: {
    position: "absolute",
    top: 24,
    right: 24,
  },
  tierCardTitle: {
    color: "#dae2fd",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  tierCardBody: {
    fontFamily: "Hanken Grotesk",
    color: "#bcc8cf",
    fontSize: 16,
    lineHeight: 22,
  },
  radioCard: {
    backgroundColor: "#171f33",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 16,
  },
  radioCardChecked: {
    borderColor: "#7fdaff",
    backgroundColor: "rgba(127, 218, 255, 0.08)",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3d494e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  radioOuterChecked: {
    borderColor: "#7fdaff",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7fdaff",
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    color: "#dae2fd",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  radioDescription: {
    fontFamily: "Hanken Grotesk",
    color: "#bcc8cf",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  radioSubDescription: {
    fontFamily: "Hanken Grotesk",
    color: "#bcc8cf",
    fontSize: 16,
    opacity: 0.8,
  },
  radioNote: {
    fontSize: 12,
    color: "rgba(188,200,207,0.6)",
    fontStyle: "italic",
    marginTop: 8,
  },
  noteContainer: {
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  noteText: {
    color: "#7fdaff",
    fontSize: 14,
    lineHeight: 20,
  },
  proAlertBanner: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 25,
    alignItems: "center",
  },
  proAlertText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(11, 19, 38, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  footerButton: {
    maxWidth: 672,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#6f00be", // secondary-container theme purple
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: "#3d494e",
    opacity: 0.6,
  },
  footerButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});
