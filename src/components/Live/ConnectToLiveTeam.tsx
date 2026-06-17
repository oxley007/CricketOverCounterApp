import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useLiveStore } from "../../state/liveStore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { getTeamCode } from "../../utils/liveHelpers";

type Props = {
  requireAuth: (callback: () => Promise<void>) => Promise<void>;
  onAuthSuccess: () => void;
};

export default function ConnectToLiveTeam({
  requireAuth,
  onAuthSuccess,
}: Props) {
  const [input, setInput] = useState("");

  const addSupporterTeam = useLiveStore((s) => s.addSupporterTeam);

  const handleConnect = async () => {
    requireAuth(async () => {
      if (!input.trim()) {
        Alert.alert("Enter a team code");
        return;
      }

      try {
        console.log("🔤 Raw input:", input);
        console.log("🧼 Trimmed input:", input.trim());

        const teamCode = getTeamCode(input.trim());

        console.log("🎯 Normalised teamCode:", teamCode);

        const ref = doc(db, "publicTeams", teamCode);
        console.log("📄 Firestore path:", `publicTeams/${teamCode}`);

        const snap = await getDoc(ref);

        console.log("📦 Exists:", snap.exists());
        console.log("📦 Data:", snap.data());

        if (!snap.exists()) {
          Alert.alert("Team not found");
          return;
        }

        // ✅ Save into Zustand
        addSupporterTeam(teamCode);

        Alert.alert("Connected!", `Now following ${teamCode}`, [
          {
            text: "Continue",
            onPress: onAuthSuccess,
          },
        ]);
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Team not found",
          "Check the team code and try again. It should look like TEAM-ABC123.",
        );
      }
    });
  };

  return (
    <View style={styles.subComponentContainer}>
      {/* Input field with floating QR icon */}
      <View style={styles.inputGroup}>
        <Text style={styles.labelCaps}>TEAM CODE</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="TEAM-ABC123"
            placeholderTextColor="rgba(188, 200, 207, 0.4)" // text-on-surface-variant/40
            autoCapitalize="characters"
            style={styles.monoInput}
          />
        </View>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.primaryButton}
        onPress={handleConnect}
      >
        <Text style={styles.buttonText}>Connect Team</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  subComponentContainer: {
    gap: 12, // matches the parent card layout separation
    marginTop: 4,
  },
  inputGroup: {
    gap: 4, // space-y-stack-sm
  },
  labelCaps: {
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96, // 12 * 0.08em
    fontWeight: "600",
    color: "#bcc8cf", // text-on-surface-variant
    marginLeft: 4, // ml-1
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  monoInput: {
    width: "100%",
    backgroundColor: "#2d3449", // bg-surface-container-highest
    borderRadius: 8, // rounded-lg
    paddingVertical: 16, // py-4
    paddingLeft: 16,
    paddingRight: 48, // Leave space so text doesn't slide under the QR icon
    color: "#7fdaff", // text-primary
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", // tracking-widest fallback
    fontSize: 14,
    fontWeight: "500",
  },
  rightIconWrapper: {
    position: "absolute",
    right: 16, // right-4
  },
  materialIcon: {
    fontFamily: "Material Symbols Outlined", // requires standard asset registration
    fontSize: 24,
    color: "#7fdaff", // text-primary
  },
  iconMuted: {
    color: "rgba(188, 200, 207, 0.5)", // text-on-surface-variant/50
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 16, // py-4
    backgroundColor: "#7fdaff", // bg-primary
    borderRadius: 8, // rounded-lg
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    color: "#003545", // text-on-primary
    fontWeight: "700",
    fontSize: 16,
  },
});
