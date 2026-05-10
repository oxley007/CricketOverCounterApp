import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
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
    <View style={styles.container}>
      <Text style={styles.label}>Enter Team Code</Text>

      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="TEAM-ABC123"
        autoCapitalize="characters"
        style={styles.input}
      />

      <Button title="Connect" onPress={handleConnect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});
