// app/(drawer)/live-scoring-home.tsx

import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SubscriptionList from "../../components/iap/SubscriptionList";
import AuthModal from "../../components/AuthModal";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useStartModalStore } from "../../state/startModalStore";
import ConnectToLiveTeam from "../../components/Live/ConnectToLiveTeam";

export default function LiveScoringHome() {
  const router = useRouter();

  const openStartModal = useStartModalStore((s) => s.open);

  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    allowGuest: false, // force login for this flow
  });

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

          {/* Title */}
          <View style={styles.sectionPillHeader}>
            <Text style={styles.title}>LittleWicket Live</Text>

            <Text style={styles.subtitle}>
              Keep parents and supporters in the loop!
            </Text>
          </View>

          {/* SECTION 1: COACHES/SCORERS */}
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>Coaches/Scorers</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.tierTitle}>
              Setup Live Scoring (for coaches/scorers)
            </Text>
            <Text style={styles.bodyText}>
              Start live scoring to update your team’s fans in real-time.
            </Text>
            <Text style={styles.bodyText}>
              Record every ball, run, and wicket. Share the generated Team ID
              with supporters or parents so they can follow along.
            </Text>
            <Pressable style={styles.ctaButton} onPress={() => setupScoring()}>
              <Text style={styles.ctaButtonText}>Setup Live Scoring</Text>
            </Pressable>
          </View>

          {/* SECTION 2: PARENTS/SUPPORTERS */}
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>Supporters/Parents</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.tierTitle}>
              Enter Team ID (for supporters/Parents)
            </Text>
            <Text style={styles.bodyText}>
              Paste the Team ID shared by your coach below to see live
              scorecards and player stats.
            </Text>
            <Text style={styles.bodyText}>
              Get ball-by-ball updates with Pro, or stay updated every 2 overs
              with our Free plan.
            </Text>
            <ConnectToLiveTeam
              requireAuth={requireAuth}
              onAuthSuccess={() => router.replace("/live-scoring-fixtures")}
            />
            {/* Input field and logic would follow here */}
          </View>
        </ScrollView>
      </View>
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
  ctaButtonText: {
    color: "#fff",
    fontSize: 20,
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
