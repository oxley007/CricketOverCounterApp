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
    const proSubscriptionMessage = !isLivePro
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.sectionPillHeader}>
            <Text style={styles.title}>Live Scoring Setup</Text>
            <Text style={styles.subtitle}>Select team & players</Text>
          </View>

          {/* TEAM SELECTION */}
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>SELECT TEAM</Text>
          </View>

          {liveConfiguredTeams.map((team) => {
            const currentCode =
              liveTeams.find((lt) => lt.teamId === team.id)?.teamCode ||
              getTeamCode(team.id);
            return (
              <Pressable
                key={team.id}
                style={styles.card}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <View style={styles.cardRow}>
                  <View style={styles.radioOuter}>
                    {selectedTeamId === team.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.tierTitle}>{team.name}</Text>
                    <Text style={styles.bodyText}>{currentCode}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* PLAYER SELECTION - Hides automatically for BallCounter empty teams */}
          {hasPlayersInTeam && (
            <>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>SELECT PLAYERS</Text>
              </View>

              {isReminderMode && (
                <Pressable style={styles.reminderButton} onPress={handleCopy}>
                  <Icon name={"content-copy"} size={20} color="#fff" />
                  <Text style={styles.copyText}>Send Reminder</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.selectAllButton}
                onPress={selectAllPlayers}
              >
                <Text style={styles.selectAllText}>Select All Players</Text>
              </Pressable>

              {(selectedTeam.players || []).map((player: Player) => (
                <Pressable
                  key={player.id}
                  style={styles.card}
                  onPress={() => togglePlayer(player.id)}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.radioOuter}>
                      {selectedPlayerIds.includes(player.id) && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.tierTitle}>{player.name}</Text>
                      <Text
                        style={[
                          styles.bodyText,
                          { color: "#666", fontSize: 12 },
                        ]}
                      >
                        ID: {player.id}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          {/* ACTIONS */}
          <Pressable style={styles.copyButton} onPress={handleCopy}>
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyText}>Copy Instructions</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={handleWhatsApp}>
            <Icon name="whatsapp" size={20} color="#fff" />
            <Text style={styles.copyText}>Share via WhatsApp</Text>
          </Pressable>

          <Pressable style={styles.shareButtonAlt} onPress={handleSMS}>
            <Icon name="message-text" size={20} color="#fff" />
            <Text style={styles.copyText}>Share via SMS</Text>
          </Pressable>
        </ScrollView>
      </View>
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#12c2e9" },
  content: { padding: 20, paddingBottom: 40 },
  backButton: {
    marginBottom: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  backText: { color: "#fff", fontWeight: "600" },
  sectionPillHeader: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  title: { fontSize: 28, color: "#fff", fontWeight: "800" },
  subtitle: { color: "#fff" },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 6,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionPillText: { color: "#fff", fontWeight: "800" },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tierTitle: { fontSize: 16, fontWeight: "700" },
  bodyText: { fontSize: 14 },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },
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
  cardContent: { flex: 1 },
  selectAllButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectAllText: { color: "#fff", textAlign: "center" },
  copyButton: {
    marginTop: 20,
    backgroundColor: "#c471ed",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
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
  copyText: { color: "#fff", fontWeight: "700" },
});
