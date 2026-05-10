// app/(drawer)/live-scoring-instructions.tsx

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AuthModal from "../../components/AuthModal";
import { auth } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";

export default function LiveScoringInstructions() {
  const router = useRouter();

  const [authVisible, setAuthVisible] = useState(false);

  // 🔹 STATIC DATA (replace later)
  const teams = [
    {
      id: "team1",
      name: "Auckland Juniors",
      teamId: "TEAM-12345",
      players: ["P-001", "P-002", "P-003", "P-004"],
    },
    {
      id: "team2",
      name: "Wellington Warriors",
      teamId: "TEAM-67890",
      players: ["P-101", "P-102", "P-103"],
    },
  ];

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId)!,
    [selectedTeamId],
  );

  useEffect(() => {
    if (!auth.currentUser && !useAuthStore.getState().isGuest) {
      setAuthVisible(true);
    }
  }, []);

  // Reset players when team changes
  useEffect(() => {
    setSelectedPlayers([]);
  }, [selectedTeamId]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const selectAllPlayers = () => {
    setSelectedPlayers(selectedTeam.players);
  };

  const shareText = `Hi everyone,

You can now follow live scores for our games using the LittleWicket app 🏏

1. Download the app  
2. Enter the Team ID and your Player ID  

Team ID: ${selectedTeam.teamId}  
Player ID(s):  
${(selectedPlayers.length ? selectedPlayers : selectedTeam.players).join("\n")}

Download: [APP LINK]`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareText);
    Alert.alert("Copied", "IDs copied to clipboard");
  };

  const handleWhatsApp = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

  const handleSMS = async () => {
    const url = `sms:?body=${encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

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

          {teams.map((team) => (
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
                  <Text style={styles.bodyText}>{team.teamId}</Text>
                </View>
              </View>
            </Pressable>
          ))}

          {/* PLAYER SELECTION */}
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>SELECT PLAYERS</Text>
          </View>

          <Pressable style={styles.selectAllButton} onPress={selectAllPlayers}>
            <Text style={styles.selectAllText}>Select All Players</Text>
          </Pressable>

          {selectedTeam.players.map((id) => (
            <Pressable
              key={id}
              style={styles.card}
              onPress={() => togglePlayer(id)}
            >
              <View style={styles.cardRow}>
                <View style={styles.radioOuter}>
                  {selectedPlayers.includes(id) && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.tierTitle}>{id}</Text>
                </View>
              </View>
            </Pressable>
          ))}

          {/* ACTIONS */}
          <Pressable style={styles.copyButton} onPress={handleCopy}>
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={handleWhatsApp}>
            <Icon name="whatsapp" size={20} color="#fff" />
            <Text style={styles.copyText}>WhatsApp</Text>
          </Pressable>

          <Pressable style={styles.shareButtonAlt} onPress={handleSMS}>
            <Icon name="message-text" size={20} color="#fff" />
            <Text style={styles.copyText}>SMS</Text>
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
