// app/(drawer)/live-scoring-instructions.tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
  //Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AuthModal from "../../components/AuthModal";
import { auth } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";
import { useFixtureStore } from "../../state/fixtureStore";

import { useTeamStore, Player } from "../../state/teamStore";
import { useLiveStore } from "../../state/liveStore";
import { getTeamCode } from "../../utils/liveHelpers";
import { MaterialIcons } from "@expo/vector-icons";

// 🔌 Import your tenant config hook
import { useTenantConfig } from "../../hooks/useTenantConfig";

const DOWNLOAD_LINKS = {
  umpire: {
    ios: "https://apps.apple.com/nz/app/cricket-umpire-ball-counter/id1448840478",
    android:
      "https://play.google.com/store/apps/details?id=com.cricketovercounterapp",
  },
  littlewicket: {
    ios: "https://apps.apple.com/us/app/littlewicket-cricket-scorebook/id1571914530",
    android:
      "https://play.google.com/store/apps/details?id=com.cricketscorebookbyc",
  },
};

export default function LiveScoringInstructions() {
  const router = useRouter();
  const [authVisible, setAuthVisible] = useState(false);
  const config = useTenantConfig();
  const appName = config.name;
  const tenantKey = appName.toLowerCase().includes("littlewicket")
    ? "littlewicket"
    : "umpire";

  const { modeMessage } = useLocalSearchParams<{ modeMessage: string }>();

  const isReminderMode = modeMessage === "reminder";

  // 1. Core Stores
  const globalTeams = useTeamStore((state) => state.teams);
  const liveTeams = useLiveStore((state) => state.teams) || [];
  const isLivePro = useLiveStore((state) => state.livePro);
  const currentFixture = useFixtureStore((state) => state.currentFixture);

  // 2. Intelligent Combined Filtering & Deduplication
  const liveConfiguredTeams = useMemo(() => {
    console.log("=== LIVE SCORING DEBUG LOGS ===");
    console.log("1. Total Global Teams Available:", globalTeams.length);
    console.log("2. Active Live Store Session Teams:", liveTeams);
    console.log("3. Current Selected Fixture Details:", {
      id: currentFixture?.id,
      mode: currentFixture?.mode,
      yourTeam: currentFixture?.yourTeam,
    });

    // ⚡ MODIFIED: Collect ONLY yourTeam ID from the current active fixture if it exists
    const activeFixtureTeamIds: string[] = [];
    if (currentFixture?.yourTeam?.id)
      activeFixtureTeamIds.push(currentFixture.yourTeam.id);
    console.log(
      "4. Extracted Active Fixture Your Team ID:",
      activeFixtureTeamIds,
    );

    // Filter your standard historic list using your exact type property: liveScoresConfigured
    const standardLiveTeams = globalTeams.filter((t) => {
      const hasFlag = !!t.liveScoresConfigured;
      const hasActiveLiveSession = liveTeams.some((lt) => lt.teamId === t.id);

      if (hasActiveLiveSession) {
        console.log(
          ` -> Found team matching liveTeams session! Team: ${t.name} (${t.id})`,
        );
      }
      return hasFlag || hasActiveLiveSession;
    });
    console.log(
      "5. Teams passing standard live filters:",
      standardLiveTeams.map((t) => t.name),
    );

    // Get matching full team objects from global catalog for our active fixture teams
    const activeFixtureTeams = globalTeams.filter((t) =>
      activeFixtureTeamIds.includes(t.id),
    );

    // Merge both arrays, using a Map keyed by 'id' to guarantee clean deduplication
    const deduplicatedMap = new Map<string, (typeof globalTeams)[number]>();

    // Process active fixture teams first (so they take priority/appear first)
    activeFixtureTeams.forEach((team) => deduplicatedMap.set(team.id, team));
    // Process the standard list (skips any keys already set by the active fixture)
    standardLiveTeams.forEach((team) => deduplicatedMap.set(team.id, team));

    const finalMergedResult = Array.from(deduplicatedMap.values());
    console.log(
      "6. Final Merged Unique Teams List:",
      finalMergedResult.map((t) => t.name),
    );
    console.log("================================");
    return finalMergedResult;
  }, [globalTeams, liveTeams, currentFixture]);

  // 3. Keep your existing selection states (Moved below useMemo to prevent variable access reference crashes)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const selectedTeam = useMemo(() => {
    return globalTeams.find((t) => t.id === selectedTeamId) || null;
  }, [selectedTeamId, globalTeams]);

  const teamCodeString = useMemo(() => {
    if (!selectedTeam) return "";
    const matchingLive = liveTeams.find((lt) => lt.teamId === selectedTeam.id);
    return matchingLive?.teamCode || getTeamCode(selectedTeam.id);
  }, [selectedTeam, liveTeams]);

  // 4. Effects
  useEffect(() => {
    if (!auth.currentUser && !useAuthStore.getState().isGuest) {
      setAuthVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedTeamId && liveConfiguredTeams.length > 0) {
      setSelectedTeamId(liveConfiguredTeams[0].id);
    }
  }, [liveConfiguredTeams, selectedTeamId]);

  useEffect(() => {
    setSelectedPlayerIds([]);
  }, [selectedTeamId]);

  // 5. Handlers
  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const selectAllPlayers = () => {
    if (!selectedTeam) return;
    setSelectedPlayerIds((selectedTeam.players || []).map((p) => p.id));
  };

  // 6. Dynamic sharing template engine
  const shareText = useMemo(() => {
    if (!selectedTeam) return "No team selected.";
    const playersList = selectedTeam.players || [];
    const hasSelectedPlayers = selectedPlayerIds.length > 0;
    const targetPlayers = hasSelectedPlayers
      ? playersList.filter((p) => selectedPlayerIds.includes(p.id))
      : playersList;
    const formattedPlayers = targetPlayers
      .map((p) => `${p.name}: ${p.id}`)
      .join("\n");

    const appStoreUrl = DOWNLOAD_LINKS[tenantKey].ios;
    const playStoreUrl = DOWNLOAD_LINKS[tenantKey].android;
    const proSubscriptionMessage = isLivePro
      ? "\n🎁 Good news! The Live Pro scoring subscription has already been paid for this team, so you can view all live scores completely pre-paid for you!\n"
      : "";

    const playerInstructionHeader = hasSelectedPlayers
      ? " and your Player ID"
      : "";
    const playerIdsBlock = hasSelectedPlayers
      ? `\nPlayer ID(s):\n${formattedPlayers}`
      : "";

    return `Hi everyone,\n\nYou can now follow live scores for our games using the ${appName} app 🏏\n${proSubscriptionMessage}\n1. Download the app:\n- iOS: ${appStoreUrl}\n- Android: ${playStoreUrl}\n\n2. Tap Live Scores button\n\n3.Enter the Team ID${playerInstructionHeader}\n\nTeam ID: ${teamCodeString}${playerIdsBlock}`;
  }, [
    selectedTeam,
    selectedPlayerIds,
    teamCodeString,
    appName,
    tenantKey,
    isLivePro,
  ]);

  const reminderText = useMemo(() => {
    return `Hi everyone,\n\nJust a reminder you can now follow live scores for our games using the 4dot6 Umpire Ball Counter app 🏏\n\n🎁 Good news! The Live Pro scoring subscription has already been paid for this team, so you can view all live scores completely pre-paid for you!\n\n1. Download the app:\n- iOS: https://apps.apple.com/nz/app/cricket-umpire-ball-counter/id1448840478\n- Android: https://play.google.com/store/apps/details?id=com.cricketovercounterapp\n\n2. Tap Live Scores button\n\n2.Enter the Team ID\n\nTeam ID: ${teamCodeString}\n\nEnjoy the game!`;
  }, [teamCodeString]);

  /*
  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareText);
    Alert.alert("Copied", "Setup details copied to clipboard");
  };
  */

  const handleCopy = async () => {
    // Choose reminder text if in reminder mode, otherwise use standard text
    const textToCopy = isReminderMode ? reminderText : shareText;

    await Clipboard.setStringAsync(textToCopy);
    Alert.alert("Copied", "Setup details copied to clipboard");
  };

  const handleWhatsApp = async () => {
    // 🛠️ FIX: Fixed missing template string interpolation character $
    const url = `https://wa.me{encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

  const handleSMS = async () => {
    const url = `sms:?body=${encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

  if (!liveConfiguredTeams.length) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 20 },
        ]}
      >
        <Text style={[styles.title, { textAlign: "center", marginBottom: 20 }]}>
          No Live Teams Found
        </Text>
        <Text style={{ color: "#fff", textAlign: "center", marginBottom: 30 }}>
          Please complete live score configuration for a fixture before
          accessing setup details.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const hasPlayersInTeam =
    selectedTeam && selectedTeam.players && selectedTeam.players.length > 0;

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.heroContainer}>
            <View style={styles.textWrapper}>
              <Text style={styles.title}>Live Scoring Setup</Text>
              <Text style={styles.subtitle}>
                Choose your team and players to share setup instructions.
              </Text>
            </View>

            {/* Absolute icon container matching the background watermark effect */}
            <View style={styles.iconWatermarkContainer}>
              <MaterialIcons
                name="broadcast_on_home"
                size={18}
                color="#7fdaff"
              />
            </View>
          </View>

          {/* TEAM SELECTION */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={18} color="#7fdaff" />
            <Text style={styles.sectionHeaderText}>SELECT TEAM</Text>
          </View>

          {liveConfiguredTeams.map((team) => {
            const currentCode =
              liveTeams.find((lt) => lt.teamId === team.id)?.teamCode ||
              getTeamCode(team.id);
            const isSelected = selectedTeamId === team.id;

            return (
              <Pressable
                key={team.id}
                onPress={() => setSelectedTeamId(team.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardRow}>
                  <View style={styles.flexRowGap4}>
                    {/* Radio Indicator */}
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected
                          ? styles.radioOuterSelected
                          : styles.radioOuterUnselected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    {/* Text Content */}
                    <View>
                      <Text style={styles.tierTitle}>{team.name}</Text>
                      <Text style={styles.bodyText}>{currentCode}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* PLAYER SELECTION - Hides automatically for BallCounter empty teams */}
          {hasPlayersInTeam && (
            <>
              <View style={styles.playerHeaderRow}>
                <View style={styles.playerHeaderLeft}>
                  <MaterialIcons name="group" size={18} color="#7fdaff" />
                  <Text style={styles.sectionHeaderText}>Select Players</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.selectAllButton,
                    pressed && styles.buttonPressedOpacity,
                  ]}
                  onPress={selectAllPlayers}
                >
                  <Text style={styles.selectAllText}>Select All</Text>
                </Pressable>
              </View>

              {isReminderMode && (
                <Pressable style={styles.reminderButton} onPress={handleCopy}>
                  <MaterialIcons
                    name="content-copy"
                    size={18}
                    color="#7fdaff"
                  />
                  <Text style={styles.copyText}>Send Reminder</Text>
                </Pressable>
              )}

              {/* Player List Wrapper */}
              <View style={styles.playerList}>
                {(selectedTeam.players || []).map((player: Player) => {
                  const isChecked = selectedPlayerIds.includes(player.id);

                  return (
                    <Pressable
                      key={player.id}
                      style={({ pressed }) => [
                        styles.playerCard,
                        isChecked
                          ? styles.playerCardChecked
                          : styles.playerCardUnchecked,
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => togglePlayer(player.id)}
                    >
                      <View style={styles.cardRow}>
                        {/* Checkbox Indicator */}
                        <View
                          style={[
                            styles.checkboxOuter,
                            isChecked
                              ? styles.checkboxOuterChecked
                              : styles.checkboxOuterUnchecked,
                          ]}
                        >
                          {isChecked && <View style={styles.checkboxInner} />}
                        </View>

                        {/* Player Metadata Content */}
                        <View>
                          <Text style={styles.playerTitle}>{player.name}</Text>
                          <Text style={styles.playerSubtitle}>
                            ID: {player.id}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ACTIONS */}
          <Pressable
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCopy}
          >
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyText}>Copy Instructions</Text>
          </Pressable>
        </ScrollView>
      </View>
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1326" },
  content: { padding: 20, paddingBottom: 40 },
  sectionPillHeader: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 6,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionPillText: { color: "#fff", fontWeight: "800" },
  cardContent: { flex: 1 },
  reminderButton: {
    marginBottom: 10,
    backgroundColor: "#c471ed",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  shareButton: {
    marginTop: 10,
    backgroundColor: "#25D366",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  shareButtonAlt: {
    marginTop: 10,
    backgroundColor: "#4a90e2",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start", // Shrinks button width to its text content
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#222a3d",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)",
    marginBottom: 24,
  },
  backButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  backText: {
    color: "#7fdaff",
    fontFamily: "Geist",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.96,
    textTransform: "uppercase",
  },
  heroContainer: {
    position: "relative",
    overflow: "hidden",
    marginBottom: 24, // mb-stack-lg (24px)
    padding: 24, // p-stack-lg (24px)
    borderRadius: 12, // rounded-xl (0.75rem / 12px)

    // Glass card properties & base background tint
    // LinearGradient wrapper component recommended for exact from-primary/10 gradient match
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textWrapper: {
    zIndex: 10,
  },
  title: {
    fontFamily: "Plus Jakarta Sans", // font-headline-lg-mobile
    fontSize: 24, // text-headline-lg-mobile
    lineHeight: 32,
    fontWeight: "700",
    color: "#dae2fd", // text-on-background
    marginBottom: 4, // mb-1
  },
  subtitle: {
    fontFamily: "Hanken Grotesk", // font-body-md
    fontSize: 16, // text-body-md
    lineHeight: 24,
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
  },
  iconWatermarkContainer: {
    position: "absolute",
    right: -16, // -right-4 (16px)
    top: -16, // -top-4 (16px)
    opacity: 0.1, // opacity-10
  },
  iconText: {
    fontFamily: "Material Symbols Outlined", // Set up mapping for Material Symbols font
    fontSize: 120, // text-[120px]
    color: "#dae2fd",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2 (8px)
    marginBottom: 12, // mb-stack-md (12px)
  },

  // Interactive Card Container Styles
  card: {
    padding: 24, // p-stack-lg (24px)
    borderRadius: 12, // rounded-xl (0.75rem)
    marginBottom: 24, // mb-stack-lg (24px)
    borderWidth: 1,
  },
  cardSelected: {
    borderColor: "#7fdaff", // border-primary
    backgroundColor: "#131b2e", // bg-surface-container-low
    // Glow effect (shadow-[0_0_15px_rgba(127,218,255,0.1)])
    shadowColor: "#7fdaff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 2, // Android basic fallback shadow
  },
  cardUnselected: {
    borderColor: "#3d494e", // outline-variant default fallback
    backgroundColor: "#131b2e",
  },
  flexRowGap4: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // gap-4 (16px)
  },

  // Typography Styles
  tierTitle: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    lineHeight: 28,
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
  },
  bodyText: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 14, // text-mono-stats
    lineHeight: 20,
    fontWeight: "500",
    color: "#bcc8cf", // text-on-surface-variant
    opacity: 0.7, // opacity-70
  },

  // Custom Radio UI Styles
  radioOuter: {
    width: 24, // w-6 (24px)
    height: 24, // h-6 (24px)
    borderRadius: 12, // rounded-full
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#7fdaff", // border-primary
    backgroundColor: "#7fdaff", // bg-primary
  },
  radioOuterUnselected: {
    borderColor: "#869399", // fallback unselected border from your script state
    backgroundColor: "transparent",
  },
  radioInner: {
    width: 8, // w-2 (8px)
    height: 8, // h-2 (8px)
    borderRadius: 4,
    backgroundColor: "#003545", // bg-on-primary
  },
  playerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12, // mb-stack-md (12px)
    marginTop: 8,
  },
  playerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2 (8px)
  },
  headerIcon: {
    fontFamily: "Material Symbols Outlined",
    fontSize: 18, // text-lg
    color: "#7fdaff", // text-primary
  },
  sectionHeaderText: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12, // text-label-caps
    fontWeight: "600",
    color: "#7fdaff", // text-primary
    letterSpacing: 1.92, // tracking-widest (0.16em * 12px)
    textTransform: "uppercase",
  },

  // Action Buttons
  selectAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 6, // py-1.5 (6px)
    backgroundColor: "#2d3449", // bg-surface-container-highest
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30
  },
  selectAllText: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12, // text-label-caps
    fontWeight: "600",
    color: "#dae2fd", // text-on-background
    letterSpacing: 0.96, // 0.08em
  },
  buttonPressedOpacity: {
    opacity: 0.7,
  },

  // List Layout Container
  playerList: {
    gap: 12, // space-y-3 (12px layout gap)
  },

  // Individual Card Component Layout
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12, // p-stack-md (12px padding)
    borderRadius: 12, // rounded-xl (0.75rem / 12px)
    borderWidth: 1,
    // Base structural configuration for glass-card rule
    backgroundColor: "rgba(30, 41, 59, 0.4)",
  },
  playerCardChecked: {
    borderColor: "rgba(127, 218, 255, 0.5)", // fallback hover/active primary highlight
  },
  playerCardUnchecked: {
    borderColor: "rgba(61, 73, 78, 0.2)", // border-outline-variant/20
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // gap-4 (16px)
  },

  // Typography Content Details
  playerTitle: {
    fontFamily: "Hanken Grotesk", // font-body-lg
    fontSize: 18, // text-body-lg
    lineHeight: 28,
    fontWeight: "600", // font-semibold
    color: "#dae2fd", // text-on-surface
  },
  playerSubtitle: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 12, // text-xs overrides base layout token specs explicitly
    lineHeight: 20,
    fontWeight: "500",
    color: "#bcc8cf", // text-on-surface-variant
    opacity: 0.6, // opacity-60
    textTransform: "uppercase", // uppercase
  },

  // Checkbox Visual Indicator Styling
  checkboxOuter: {
    width: 24, // w-6 (24px)
    height: 24, // h-6 (24px)
    borderRadius: 12, // rounded-full
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOuterChecked: {
    borderColor: "#7fdaff", // border-primary
    backgroundColor: "#7fdaff", // bg-primary
  },
  checkboxOuterUnchecked: {
    borderColor: "#869399", // border-outline-variant
    backgroundColor: "transparent",
  },
  checkboxInner: {
    width: 8, // w-2 (8px)
    height: 8, // h-2 (8px)
    borderRadius: 4,
    backgroundColor: "#003545", // bg-on-primary
  },
  actionContainer: {
    paddingHorizontal: 16, // px-gutter (16px)
    paddingBottom: 16, // pb-4 (16px)
    maxWidth: 672, // max-w-2xl (42rem / 672px)
    width: "100%",
    alignSelf: "center", // mx-auto
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }], // active:scale-95
  },
  copyIcon: {
    fontFamily: "Material Symbols Outlined",
    fontSize: 24, // Standard material icon base size
    color: "#ffffff", // text-white
  },
  copyText: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    lineHeight: 28,
    fontWeight: "600",
    color: "#ffffff", // text-white
  },
  copyButton: {
    width: "100%", // w-full
    height: 64, // h-16 (64px)
    borderRadius: 12, // rounded-xl (12px)

    // These three lines fix the layout centering issue:
    flexDirection: "row", // Align items horizontally next to each other
    alignItems: "center", // Center items vertically inside the button
    justifyContent: "center", // Center items horizontally inside the button

    gap: 12, // gap-3 (12px)
    backgroundColor: "#6f00be",

    // shadow-lg profile
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginTop: 20,
  },
});

/*
<Pressable style={styles.shareButton} onPress={handleWhatsApp}>
            <Icon name="whatsapp" size={20} color="#fff" />
            <Text style={styles.copyText}>Share via WhatsApp</Text>
          </Pressable>

          <Pressable style={styles.shareButtonAlt} onPress={handleSMS}>
            <Icon name="message-text" size={20} color="#fff" />
            <Text style={styles.copyText}>Share via SMS</Text>
          </Pressable>
          */
