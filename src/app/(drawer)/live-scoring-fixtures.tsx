// app/(drawer)/live-scoring-home.tsx

import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AuthModal from "../../components/AuthModal";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useStartModalStore } from "../../state/startModalStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useLiveStore } from "../../state/liveStore";
import ConnectToLiveTeam from "../../components/Live/ConnectToLiveTeam";
import ConnectToLivePlayer from "../../components/Live/ConnectToLivePlayer";
import ConnectToLiveEntity from "../../components/Live/ConnectToLiveEntity";
import {
  startLiveGameListener,
  stopLiveGameListener,
} from "../../services/liveGameListener";
import FixtureCard from "../../components/Live/FixtureCard";

export default function LiveScoringFixtures() {
  const router = useRouter();

  const openStartModal = useStartModalStore((s) => s.open);
  //const fixture = useFixtureStore((s) => s.currentFixture);
  const fixtures = useLiveStore((s) => s.fixtures);
  const teamCodesSupporter = useLiveStore((s) => s.teamCodesSupporter);

  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    allowGuest: false, // force login for this flow
  });

  useEffect(() => {
    console.log("getting hit?");
    console.log(JSON.stringify(teamCodesSupporter), " teamCodesSupporter is??");

    if (!teamCodesSupporter?.length) return;

    console.log("getting hit 2?");

    // start listeners for ALL teams
    teamCodesSupporter.forEach((teamId) => {
      startLiveGameListener(teamId);
    });

    return () => {
      stopLiveGameListener(); // stops all
    };
  }, [teamCodesSupporter]);

  const setupScoring = () => {
    router.replace("/live-scoring-info");
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Back */}
          <Pressable
            onPress={() => {
              openStartModal(); // 1. Trigger the modal
              router.back(); // 2. Go back
            }}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Title Segment Container */}
          <View style={styles.cardContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Live Fixtures</Text>
              <Text style={styles.subtitle}>Keep supporters in the loop!</Text>
            </View>
          </View>

          {Object.entries(fixtures).map(([teamCode, fixture]) => (
            <FixtureCard key={teamCode} fixture={fixture} />
          ))}
          {/* Section Header Banner */}
          <View style={styles.headerBanner}>
            <Text style={styles.headerText}>Add Player to see Stats</Text>
          </View>

          <View style={styles.cardContainer}>
            <ConnectToLiveEntity
              requireAuth={requireAuth}
              onAuthSuccess={() => router.push("/live-scoring-fixtures")}
            />
          </View>

          <View style={styles.headerBanner}>
            <Text style={styles.headerText}>Add Another Team</Text>
          </View>

          <View style={styles.cardContainer}>
            <ConnectToLiveTeam
              requireAuth={requireAuth}
              onAuthSuccess={() => router.replace("/live-scoring-fixtures")}
            />
          </View>
        </ScrollView>
      </View>
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
  headerBanner: {
    backgroundColor: "rgba(45, 52, 73, 0.3)", // bg-surface-variant/30
    alignSelf: "flex-start", // inline-block
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 9999, // rounded-full
    marginBottom: 16, // mb-4 (16px base stack gap)
  },
  headerText: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#7fdaff", // text-primary
  },
  cardContainer: {
    backgroundColor: "#131b2e", // bg-surface-container-low
    borderColor: "rgba(61, 73, 78, 0.2)", // border-outline-variant/20
    borderWidth: 1,
    borderRadius: 12, // rounded-xl
    padding: 24, // p-stack-lg
    gap: 12, // space-y-stack-md
  },
  titleContainer: {
    zIndex: 10, // relative z-10
    marginBottom: 16, // Layout space context for the header block
  },
  title: {
    fontFamily: "Plus Jakarta Sans", // font-headline-lg-mobile
    fontSize: 24, // text-headline-lg-mobile (24px)
    fontWeight: "700",
    color: "#dae2fd", // text-on-background / text-on-surface
    marginBottom: 8, // mb-2 (8px base spacing stack gap)
  },
  subtitle: {
    fontFamily: "Hanken Grotesk", // font-body-md
    fontSize: 16, // text-body-md (16px)
    fontWeight: "400",
    color: "#dae2fd", // base theme text colour
    opacity: 0.9, // opacity-90
  },

  container: {
    flex: 1,
    backgroundColor: "#0b1326",
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
  ctaButtonText: {
    color: "#fff",
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
    fontSize: 26,
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
