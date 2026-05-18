// app/(drawer)/live-scoring-info.tsx

import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SubscriptionList from "../../components/iap/SubscriptionList";
import { useTeamStore } from "../../state/teamStore";
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
//import { useLiveStore } from "../../state/liveStore";
import { getActiveTeams } from "../../utils/getActiveTeams";
import { useFixtureStore } from "../../state/fixtureStore";
import { useLiveStore, type LiveTeam } from "../../state/liveStore";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import AuthModal from "../../components/AuthModal";

export default function LiveScoringInfo() {
  const router = useRouter();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    allowGuest: true, // or false if you want to force login here later
  });

  const [selectedTier, setSelectedTier] = useState<"coach" | "supporter">(
    "coach",
  );
  //const setLiveConfigured = useLiveStore((s) => s.setLiveConfigured);

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

  const handleConfigureLive = async () => {
    if (loading) return;
    await requireAuth(async () => {
      setLoading(true);
      try {
        const fixtures = useFixtureStore.getState().fixtures;
        console.log(JSON.stringify(fixtures), "fixtures is what?");

        if (!fixtures.length) {
          alert("No fixtures found. Please start a game first.");
          return;
        }

        // 1. Extract raw yourTeam references from all fixtures
        const rawTeamsFromFixtures = fixtures
          .map((f) => f.yourTeam)
          .filter((team) => !!team);

        // 2. Filter out duplicate IDs
        const uniqueTeamIds = [
          ...new Set(rawTeamsFromFixtures.map((t) => t.id)),
        ];

        // 3. Look up the FULL Team structures from your global useTeamStore state
        const { teams: globalTeams } = useTeamStore.getState();

        const activeTeams = uniqueTeamIds
          .map((id) => globalTeams.find((t) => t.id === id))
          .filter((team): team is Team => !!team); // ✅ Tells TS this is a real Team with players

        if (!activeTeams.length) {
          alert(
            "No active teams found in your team store matching these fixtures.",
          );
          return;
        }

        const liveEvents = useMatchStore.getState().events;
        const liveTeams: LiveTeam[] = [];
        const { selectedMode } = useStartModalStore.getState();
        const currentGame = useGameStore.getState().currentGame;
        const { baseRuns } = useMatchStore.getState();

        // 4. Loop through the verified, complete team objects
        for (const team of activeTeams) {
          const teamCode = await createPublicTeam(team, fixtures, liveEvents);
          if (!teamCode) continue;

          const liveTeam: LiveTeam = {
            teamId: team.id,
            teamCode,
            playerIds: (team.players ?? []).map((p) => p.id), // ✅ Safe & clear of TS errors
          };
          liveTeams.push(liveTeam);

          useTeamStore.getState().markLiveConfigured(team.id);

          // Sync the team and its full roster cleanly into subcollections
          await updatePublicTeamData(team.id, team); // ✅ Safe & clear of TS errors

          // Find the specific fixture snapshot corresponding to this team
          const teamFixture = fixtures.find((f) => f.yourTeam?.id === team.id);

          if (teamFixture) {
            await updateLiveData(team.id, {
              ...teamFixture,
              fixtureId: teamFixture.id,
              mode: selectedMode,
            });
          }

          await updateCurrentGameData(team.id, {
            ...currentGame,
          });

          await updatebaseRunsData(team.id, {
            baseRuns,
          });
        }

        if (liveTeams.length) {
          const store = useLiveStore.getState();
          store.setTeams(liveTeams);
          store.configureLive(liveTeams[0]);
        }

        if (selectedTier === "coach") {
          setShowSubscriptionModal(true);
        } else {
          //router.back();
          router.push("/live-scoring-instructions");
        }
      } finally {
        setLoading(false);
      }
    });
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

            <Text style={styles.subtitle}>
              Keep parents and supporters in the loop!
            </Text>
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

          {/* How it works */}
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>HOW IT WORKS</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.tierTitle}>FREE Tier</Text>
            <Text style={styles.bodyText}>
              Supporters see live scores and overs (updated every 2 overs, or
              instantly at innings end).
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
            <Text style={styles.sectionPillText}>Choose who pays for PRO:</Text>
          </View>

          <Pressable
            style={styles.card}
            onPress={() => setSelectedTier("coach")}
          >
            <View style={styles.cardRow}>
              <View style={styles.radioOuter}>
                {selectedTier === "coach" && <View style={styles.radioInner} />}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.tierTitle}>Coach / Manager Pays</Text>
                <Text style={styles.bodyText}>
                  A $24.99/month subscription covers the entire team.
                </Text>
                <Text style={styles.bodyText}>
                  All parents get Pro access for free.
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
                <Text style={styles.tierTitle}>
                  Free / Parent / Supporter Pays
                </Text>
                <Text style={styles.bodyText}>
                  Each individual can use the Free Teir, or pay $4.99/month for
                  their own Pro access.
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Note */}
          <Text style={styles.note}>
            Note: Each Player ID can be linked by up to 3 supporters (e.g., two
            parents and a grandparent).
          </Text>

          {/* CTA */}
          <Pressable
            style={styles.ctaButton}
            onPress={handleConfigureLive}
            disabled={loading}
          >
            <Text style={styles.ctaText}>Configure Live Scores</Text>
          </Pressable>
        </ScrollView>
      </View>
      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tier={selectedTier}
      />
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
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
    paddingBottom: 40,
  },
  backButton: {
    //marginTop: 40,
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
    //letterSpacing: 1,
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
  bold: {
    fontWeight: "700",
  },
  note: {
    color: "#fff",
    fontSize: 13,
    marginTop: 10,
    opacity: 0.85,
  },
  ctaButton: {
    marginTop: 30,
    backgroundColor: "#c471ed",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
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

    alignItems: "center", // 👈 THIS is key
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
    borderColor: "#c471ed", // Matches your CTA button color
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2, // Aligns with the first line of text
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
