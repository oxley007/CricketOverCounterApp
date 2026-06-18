// components/Live/ConnectToLiveEntity.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
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
    <View style={styles.pt4}>
      {/* Main Container Card */}
      <View style={styles.containerCard}>
        {/* Team ID Segment */}
        <View style={styles.inputGroup}>
          <View style={styles.textContainer}>
            <Text style={styles.tierTitle}>Enter Team ID</Text>
            <Text style={styles.bodyText}>
              Paste the Team ID shared by a coach to see live scorecards and
              player stats.
            </Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              value={teamInput}
              onChangeText={setTeamInput}
              placeholder="TEAM-ABC123"
              placeholderTextColor="rgba(134, 147, 153, 0.4)" // text-outline/40
              autoCapitalize="characters"
              style={styles.input}
              editable={!loading}
            />
          </View>
        </View>

        {/* Visual Divider */}
        <View style={styles.orContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>AND / OPTIONAL</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Player ID Segment */}
        <View style={styles.inputGroup}>
          <View style={styles.textContainer}>
            <Text style={styles.tierTitle}>Enter Player ID (Optional)</Text>
            <Text style={styles.bodyText}>
              Paste your Player ID alongside the Team ID above to see player
              stats (optional).
            </Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              value={playerInput}
              onChangeText={setPlayerInput}
              placeholder="P-XYZ123"
              placeholderTextColor="rgba(134, 147, 153, 0.4)" // text-outline/40
              autoCapitalize="characters"
              style={styles.input}
              editable={!loading}
            />
          </View>
        </View>

        {/* Native Styled Connect Button (Replaces default cross-platform Button) */}
        <View style={styles.buttonWrapper}>
          <Pressable
            onPress={handleConnect}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#003545" size="small" />
            ) : (
              <Text style={styles.buttonText}>Connect Player</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pt4: {
    paddingTop: 16, // pt-4 / spacing.gutter
  },
  containerCard: {
    //backgroundColor: "#131b2e", // bg-surface-container-low
    //borderWidth: 1,
    //borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30
    //borderRadius: 24, // rounded-2xl
    //padding: 24, // p-6 / stack-lg
  },
  inputGroup: {
    marginBottom: 24, // space-y-6 inside card container
  },
  textContainer: {
    marginBottom: 12, // space-y-3 gap split
  },
  tierTitle: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
    marginBottom: 4, // mb-1
  },
  bodyText: {
    fontFamily: "Hanken Grotesk", // font-body-md
    fontSize: 14, // text-sm layout constraint overriding 16px font baseline
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
    opacity: 0.8, // opacity-80
    lineHeight: 20,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#171f33", // custom-input (matching surface-container token context)
    borderWidth: 1,
    borderColor: "#3d494e", // native edge support for interactive elements
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 16, // py-4
    paddingRight: 48, // space for inline right icon alignment
    color: "#dae2fd", // text-on-surface
    fontFamily: "Geist", // font-mono-stats
    fontSize: 14, // mono-stats size
    fontWeight: "500",
  },
  inputIcon: {
    position: "absolute",
    right: 16, // right-4
    fontFamily: "Material Symbols Outlined", // uses the icon font pack
    fontSize: 24,
    color: "rgba(134, 147, 153, 0.5)", // text-outline/50
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // gap-4
    paddingVertical: 8, // py-2
    marginBottom: 24, // space-y-6 context
  },
  dividerLine: {
    flexGrow: 1,
    height: 1,
    backgroundColor: "rgba(61, 73, 78, 0.3)", // bg-outline-variant/30
  },
  orText: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12, // text-label-caps
    fontWeight: "600",
    letterSpacing: 0.96, // 12px * 0.08em letter spacing
    color: "#bcc8cf", // text-on-surface-variant
  },
  buttonWrapper: {
    marginTop: 8,
  },
  button: {
    backgroundColor: "#00c2f3", // primary-container
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: "#171f33",
    borderColor: "#3d494e",
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "700",
    color: "#003545", // on-primary / target text for primary containers
  },
});
