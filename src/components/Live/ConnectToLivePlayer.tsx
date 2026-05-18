// components/ConnectToLivePlayer.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useLiveStore } from "../../state/liveStore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
// Ensure you have a helper to clean/validate player inputs, or adjust this import path
//import { getPlayerId } from "../../utils/liveHelpers";

type Props = {
  requireAuth: (callback: () => Promise<void>) => Promise<void>;
  onAuthSuccess: () => void;
};

export default function ConnectToLivePlayer({
  requireAuth,
  onAuthSuccess,
}: Props) {
  const [input, setInput] = useState("");
  const addSupporterPlayer = useLiveStore((s) => s.addSupporterPlayer);

  const handleConnect = async () => {
    requireAuth(async () => {
      if (!input.trim()) {
        Alert.alert("Enter a player ID");
        return;
      }

      try {
        console.log("🔤 Raw input:", input);
        console.log("🧼 Trimmed input:", input.trim());

        // Normalise input using helper (or use input.trim().toUpperCase() directly if no helper exists)
        const playerId = getPlayerId
          ? getPlayerId(input.trim())
          : input.trim().toUpperCase();
        console.log("🎯 Normalised playerId:", playerId);

        const ref = doc(db, "publicPlayers", playerId);
        console.log("📄 Firestore path:", `publicPlayers/${playerId}`);

        const snap = await getDoc(ref);
        console.log("📦 Exists:", snap.exists());
        console.log("📦 Data:", snap.data());

        if (!snap.exists()) {
          Alert.alert("Player not found");
          return;
        }

        // ✅ Save into Zustand
        addSupporterPlayer(playerId);

        Alert.alert("Connected!", `Now following player: ${playerId}`, [
          {
            text: "Continue",
            onPress: onAuthSuccess,
          },
        ]);
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Player not found",
          "Check the player ID and try again. It should look like PLR-XYZ123.",
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Player ID</Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="PLR-XYZ123"
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
