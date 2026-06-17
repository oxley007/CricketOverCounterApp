// app/(drawer)/live-scoring-home.tsx

import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
} from "react-native";
import SubscriptionList from "../../components/iap/SubscriptionList";
import AuthModal from "../../components/AuthModal";
import { useLiveStore } from "@/src/state/liveStore";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useStartModalStore } from "../../state/startModalStore";
import ConnectToLiveTeam from "../../components/Live/ConnectToLiveTeam";
import { listenAndMergeFixture } from "@/src/services/fixtureSyncService";
import { useTenantConfig } from "../../hooks/useTenantConfig";
import { MaterialIcons } from "@expo/vector-icons";

export default function LiveScoringHome() {
  const router = useRouter();

  const openStartModal = useStartModalStore((s) => s.open);
  const teamIds = useLiveStore((state) => state.teamCodesSupporter);
  const selectScorebook = useStartModalStore((s) => s.selectScorebook);

  const { branding } = useTenantConfig();

  useEffect(() => {
    // ✅ Correctly reading from the Zustand store
    if (!teamIds || teamIds.length === 0) return;

    console.log(
      `📡 [LIFECYCLE] Initialising live match sync channels for teams: ${teamIds.join(", ")}`,
    );

    const unsubscribers = teamIds.map((teamId) => {
      return listenAndMergeFixture(teamId);
    });

    return () => {
      console.log("🛑 [LIFECYCLE] Closing all live sync channels.");
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [teamIds]); // ✅ Dependency is now the extracted teamIds array

  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    allowGuest: false, // force login for this flow
  });

  const setupScoring = () => {
    selectScorebook();
    router.replace("/live-scoring-info");
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Pressable
              onPress={() => {
                openStartModal(); // 1. Trigger the modal
                router.back(); // 2. Go back
              }}
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

          {/* SECTION 2: SUPPORTERS */}
          <View style={styles.cardContainer}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.iconWrapper}>
                <MaterialIcons
                  name="group"
                  size={22}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
              <Text style={styles.headlineMd}>Supporters</Text>
            </View>

            {/* Description */}
            <Text style={styles.bodyMd}>
              Enter your unique Team ID below to sync with the official match
              scorer and follow every wicket, run, and over as it happens.
            </Text>

            {/* Input Field, Scan Logic, and Connect Button */}
            <ConnectToLiveTeam
              requireAuth={requireAuth}
              onAuthSuccess={() => router.replace("/live-scoring-fixtures")}
            />
          </View>

          {/* SECTION 1: COACHES/SCORERS */}
          <View style={styles.cardContainer}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.iconWrapperSecondary}>
                <MaterialIcons
                  name="stadium"
                  size={22}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
              <Text style={styles.headlineMd}>Coaches/Scorers</Text>
            </View>

            {/* Description */}

            <Text style={styles.bodyMd}>
              Start live scoring to update your team’s fans in real-time.
            </Text>
            <Text style={styles.bodyMd}>
              Record every ball, run, and wicket. Share the generated Team ID
              with supporters so they can follow along.
            </Text>

            {/* Action Button Container */}
            <View style={styles.buttonPaddingTop}>
              <TouchableOpacity
                activeOpacity={0.95}
                style={styles.secondaryContainerButton}
                onPress={() => setupScoring()}
              >
                <Text style={styles.buttonTextSecondary}>
                  Setup Live Scoring
                </Text>
              </TouchableOpacity>
            </View>
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
  container: {
    flex: 1,
    backgroundColor: "#0b1326",
  },
  content: {
    padding: 20,
    paddingBottom: 380,
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
  cardContainer: {
    backgroundColor: "#131b2e", // bg-surface-container-low
    borderColor: "rgba(61, 73, 78, 0.2)", // border-outline-variant/20
    borderWidth: 1,
    borderRadius: 12, // rounded-xl
    padding: 24, // p-stack-lg
    gap: 12, // space-y-stack-md
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3
  },
  iconWrapper: {
    backgroundColor: "rgba(0, 194, 243, 0.2)", // bg-primary-container/20
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
  },
  headlineMd: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
  },
  bodyMd: {
    fontFamily: "Hanken Grotesk",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
  },
  materialIcon: {
    fontFamily: "Material Symbols Outlined", // Ensure this font is loaded in your project
    fontSize: 24,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3
  },
  iconWrapperSecondary: {
    backgroundColor: "rgba(111, 0, 190, 0.2)", // bg-secondary-container/20
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
  },
  headlineMd: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
  },
  bodyMd: {
    fontFamily: "Hanken Grotesk",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
  },

  // --- BUTTON SECTION ---
  buttonPaddingTop: {
    paddingTop: 8, // pt-2
  },
  secondaryContainerButton: {
    width: "100%",
    paddingVertical: 16, // py-4
    backgroundColor: "#6f00be", // bg-secondary-container
    borderRadius: 8, // rounded-lg
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12, // gap-3
    ...Platform.select({
      ios: {
        shadowColor: "#6f00be", // shadow-secondary-container/10 styling fallback
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonTextSecondary: {
    color: "#d6a9ff", // text-on-secondary-container
    fontWeight: "700",
    fontSize: 16,
  },

  // --- FOOTER ROW SECTION ---
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    marginTop: 16, // mt-4
    paddingTop: 16, // pt-4
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 73, 78, 0.1)", // border-outline-variant/10
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2
  },
  monoStats: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#bcc8cf", // text-on-surface-variant
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // gap-1
  },
  linkText: {
    fontFamily: "Hanken Grotesk",
    fontSize: 14,
    color: "#7fdaff", // text-primary
  },
});
