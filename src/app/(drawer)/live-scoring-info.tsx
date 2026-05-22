// app/(drawer)/live-scoring-info.tsx

import { useRouter } from "expo-router";
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

export default function LiveScoringInfo() {
  const router = useRouter();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

        if (success) {
          router.push("/live-scoring-instructions");
        }
      } finally {
        if (!success) {
          useLiveStore.getState().setLiveConfigured(false);
        }
        setLoading(false);
      }
    });
  };

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
    if (livePro) {
      return "Configure Live Scores";
    }
    if (selectedTier === "coach") {
      return "Choose your subscription";
    }
    return "Configure Live Scores";
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Title */}
          <View style={styles.sectionPillHeader}>
            <Text style={styles.title}>LittleWicket Live</Text>
            <Text style={styles.subtitle}>Keep supporters in the loop!</Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Tap <Text style={styles.bold}>Configure Live Scores</Text> below
              to sync this account to the cloud.
            </Text>
            <Text style={styles.bodyText}>
              You’ll then get a unique Team ID and Player IDs to share with your
              team group chat.
            </Text>
          </View>

          {!livePro ? (
            <>
              {/* How it works */}
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>HOW IT WORKS</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.tierTitle}>FREE Tier</Text>
                <Text style={styles.bodyText}>
                  Supporters see live scores and overs (updated every 2 overs,
                  or instantly at innings end).
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.tierTitle}>PRO Tier</Text>
                <Text style={styles.bodyText}>
                  Real-time, ball-by-ball updates.
                </Text>
                <Text style={styles.bodyText}>
                  Includes full scorecards, run rates, batter/bowler stats, and
                  individual player performance.
                </Text>
              </View>

              {/* Pricing */}
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>
                  Choose who pays for PRO:
                </Text>
              </View>

              <Pressable
                style={styles.card}
                onPress={() => setSelectedTier("coach")}
              >
                <View style={styles.cardRow}>
                  <View style={styles.radioOuter}>
                    {selectedTier === "coach" && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.tierTitle}>Coach / Manager Pays</Text>
                    <Text style={styles.bodyText}>
                      A {coachPrice} subscription covers the entire team.
                    </Text>
                    <Text style={styles.bodyText}>
                      All supporters get Pro access for free.
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Parent Card */}
              <Pressable
                style={styles.card}
                onPress={() => setSelectedTier("supporter")}
              >
                <View style={styles.cardRow}>
                  <View style={styles.radioOuter}>
                    {selectedTier === "supporter" && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.tierTitle}>Free / Supporter Pays</Text>
                    <Text style={styles.bodyText}>
                      Each individual can use the Free Teir*, or pay{" "}
                      {supporterPrice} for their own Pro access.
                    </Text>
                    <Text style={styles.bodyTextSmall}>
                      *Free Teir updates every 2 overs
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Note */}
              <Text style={styles.note}>
                Note: Each Player ID can be linked by up to 3 supporters (e.g.,
                two parents and a grandparent).
              </Text>
            </>
          ) : (
            <View style={styles.proAlertBanner}>
              <Text style={styles.proAlertText}>
                Pro Live purchased, you can now configure your live scoring
              </Text>
            </View>
          )}

          {/* CTA */}
          <Pressable
            style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
            onPress={handleConfigureLive}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>{getButtonText()}</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tier={selectedTier}
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
    backgroundColor: "#12c2e9",
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },
  bodyText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  bodyTextSmall: {
    fontSize: 10,
    color: "#999",
    marginBottom: 6,
  },
  bold: {
    fontWeight: "700",
  },
  note: {
    color: "#fff",
    fontSize: 13,
    marginTop: 10,
    opacity: 0.85,
    marginBottom: 15,
  },
  proAlertBanner: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  proAlertText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 15,
    backgroundColor: "#c471ed",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionPillHeader: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionPillText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#c471ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#c471ed",
  },
  cardContent: {
    flex: 1,
  },
});
