// components/Live/ConnectToLiveEntity.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useLiveStore } from "../../state/liveStore";
import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { getTeamCode } from "../../utils/liveHelpers";

// 📡 Import your background listener function
import { listenAndMergeFixture } from "../../services/fixtureSyncService";

type Props = {
  requireAuth: (callback: () => Promise<void>) => Promise<void>;
  onAuthSuccess: () => void;
};

export default function ConnectToLiveEntity({
  requireAuth,
  onAuthSuccess,
}: Props) {
  const [teamInput, setTeamInput] = useState("");
  const [playerInput, setPlayerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const addSupporterTeam = useLiveStore((s) => s.addSupporterTeam);
  const addSupporterPlayer = useLiveStore((s) => s.addSupporterPlayer);

  // 🔍 ADD THIS LOG HERE (Top of the component body)
  const trackedTeams = useLiveStore((s) => s.teamCodesSupporter);
  const trackedPlayers = useLiveStore((s) => s.playerCodesSupporter);
  const trackedPlayerNames = useLiveStore((s) => s.supporterPlayerNames);

  console.log("👀 ConnectToLiveEntity Render - Tracked State:", {
    teams: trackedTeams,
    players: trackedPlayers,
    names: trackedPlayerNames,
  });

  const handleConnect = async () => {
    requireAuth(async () => {
      const cleanTeam = teamInput.trim();
      const cleanPlayer = playerInput.trim();

      if (!cleanTeam) {
        Alert.alert(
          "Missing Information",
          "Please also enter the Team ID to add a player.",
        );
        return;
      }

      setLoading(true);
      try {
        const teamCode = getTeamCode(cleanTeam);
        const teamRef = doc(db, "publicTeams", teamCode);
        const teamSnap = await getDoc(teamRef);

        if (!teamSnap.exists()) {
          Alert.alert(
            "Not Found",
            "Team code not found. Check the ID and try again.",
          );
          setLoading(false);
          return;
        }

        // CASE 1: Connection contains a specific player identifier context
        if (cleanPlayer) {
          // 🧼 Safe Clean: Strip away any cosmetic "P-" prefix copied from instructions screen
          const rawPlayerId = cleanPlayer.replace(/^P-/i, "").toUpperCase();

          // Search inside the 'teams' subcollection under this public team reference
          const subTeamsRef = collection(db, "publicTeams", teamCode, "teams");
          const subTeamsSnap = await getDocs(subTeamsRef);

          let playerFound = false;
          let foundPlayerName = "";

          // Inspect the structured arrays saved by updatePublicTeamData
          for (const docSnap of subTeamsSnap.docs) {
            const teamData = docSnap.data();
            const playersList = teamData.players || [];
            const match = playersList.find(
              (p: any) => p.id.toUpperCase() === rawPlayerId,
            );

            if (match) {
              playerFound = true;
              foundPlayerName = match.name;
              break;
            }
          }

          if (!playerFound) {
            Alert.alert(
              "Player Not Found",
              "This player ID does not match any member of this team.",
            );
            setLoading(false);
            return;
          }

          // Commit verified clean id straight into state fields
          addSupporterPlayer(rawPlayerId);
          useLiveStore
            .getState()
            .updateSupporterPlayerName(rawPlayerId, foundPlayerName);

          // Pull all match listings for this group configuration
          listenAndMergeFixture(teamCode);

          Alert.alert(
            "Connected!",
            `Now following player: ${foundPlayerName}`,
            [{ text: "Continue", onPress: onAuthSuccess }],
          );
          setPlayerInput("");
          setTeamInput("");
        }
        // CASE 2: Team ID only (Generic supporter access link tracker)
        else {
          addSupporterTeam(teamCode);
          listenAndMergeFixture(teamCode);

          Alert.alert(
            "Connected!",
            `Now following team matches for: ${teamCode}`,
            [{ text: "Continue", onPress: onAuthSuccess }],
          );
          setTeamInput("");
        }
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Connection Error",
          "Something went wrong. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Team ID Segment */}
      <Text style={styles.tierTitle}>Enter Team ID</Text>
      <Text style={styles.bodyText}>
        Paste the Team ID shared by a coach to see live scorecards and player
        stats.
      </Text>
      <TextInput
        value={teamInput}
        onChangeText={setTeamInput}
        placeholder="TEAM-ABC123"
        autoCapitalize="characters"
        style={styles.input}
        editable={!loading}
      />

      {/* Visual Divider */}
      <View style={styles.orContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>AND / OPTIONAL</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Player ID Segment */}
      <Text style={styles.tierTitle}>Enter Player ID (Optional)</Text>
      <Text style={styles.bodyText}>
        Paste your Player ID alongside the Team ID above to see player stats
        (optional).
      </Text>
      <TextInput
        value={playerInput}
        onChangeText={setPlayerInput}
        placeholder="P-XYZ123"
        autoCapitalize="characters"
        style={styles.input}
        editable={!loading}
      />

      <View style={styles.buttonWrapper}>
        <Button
          title={loading ? "Connecting..." : "Connect"}
          onPress={handleConnect}
          disabled={loading}
          color="#c471ed"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  orText: {
    marginHorizontal: 10,
    color: "#888",
    fontWeight: "600",
    fontSize: 12,
  },
  buttonWrapper: {
    marginTop: 10,
  },
});
