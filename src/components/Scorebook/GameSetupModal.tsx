import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { Team } from "../../state/teamStore";
import SeasonPickerModal from "../Seasons/SeasonPickerModal"; // ✅ correct import
import TeamPickerModal from "../Teams/TeamPickerModal";

interface Props {
  visible: boolean;
}

export default function GameSetupModal({ visible }: Props) {
  const { setSetupComplete, setGameConfig } = useGameStore();

  const [showYourTeamPicker, setShowYourTeamPicker] = useState(false);
  const [yourTeam, setYourTeam] = useState<Team | null>(null);

  const [showOppositionPicker, setShowOppositionPicker] = useState(false);
  const [oppositionTeam, setOppositionTeam] = useState<Team | null>(null);

  const [overs, setOvers] = useState("20");

  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [season, setSeason] = useState<string>(() => {
    return useGameStore.getState().lastSeason || "";
  });

  const startGame = () => {
    if (!yourTeam || !oppositionTeam) return;

    // 1️⃣ Save game config
    setGameConfig({
      yourTeam: {
        id: yourTeam.id,
        name: yourTeam.name,
      },
      oppositionTeam: {
        id: oppositionTeam.id,
        name: oppositionTeam.name,
      },
      overs: overs === "Unlimited" ? 0 : parseInt(overs, 10),
      season,
    });

    // 2️⃣ Save last season in store
    useGameStore.getState().setLastSeason(season);

    console.log("Game store after start:", useGameStore.getState());

    // 3️⃣ Mark setup complete (this closes GameSetupModal)
    setSetupComplete(true);

    // 4️⃣ Open settings modal (or whatever modal you want)
    useMatchStore.getState().openMatchRulesModal(); // ✅ this triggers your settings modal
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Setup your game</Text>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Your Team */}
              <Text style={styles.label}>Your Team</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => setShowYourTeamPicker(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    !yourTeam && styles.placeholderText,
                  ]}
                >
                  {yourTeam ? yourTeam.name : "Select your team"}
                </Text>
              </Pressable>

              <TeamPickerModal
                visible={showYourTeamPicker}
                title="Select your team"
                onSelect={(team) => {
                  setYourTeam(team);
                  setShowYourTeamPicker(false);
                }}
                onClose={() => setShowYourTeamPicker(false)}
              />

              {/* Opposition Team */}
              <Text style={styles.label}>Opposition Team</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => setShowOppositionPicker(true)}
              >
                <Text
                  style={[
                    styles.selectText,
                    !oppositionTeam && styles.placeholderText,
                  ]}
                >
                  {oppositionTeam
                    ? oppositionTeam.name
                    : "Select opposition team"}
                </Text>
              </Pressable>

              <TeamPickerModal
                visible={showOppositionPicker}
                title="Select opposition team"
                onSelect={(team) => {
                  setOppositionTeam(team);
                  setShowOppositionPicker(false);
                }}
                onClose={() => setShowOppositionPicker(false)}
              />

              {/* Overs */}
              <Text style={styles.label}>Overs</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter overs (1-100 or Unlimited)"
                value={overs}
                onChangeText={setOvers}
              />

              {/* Season */}
              <Text style={styles.label}>Season</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => setShowSeasonPicker(true)}
              >
                <Text
                  style={[styles.selectText, !season && styles.placeholderText]}
                >
                  {season || "Select season"}
                </Text>
              </Pressable>

              <SeasonPickerModal
                visible={showSeasonPicker}
                title="Select Season"
                seasons={useGameStore.getState().seasons}
                onSelect={(s) => {
                  // add to store if not already there
                  if (!useGameStore.getState().seasons.includes(s)) {
                    useGameStore.getState().addSeason(s);
                  }

                  // remember as last season
                  useGameStore.getState().setLastSeason(s);

                  // update local state
                  setSeason(s);
                  setShowSeasonPicker(false);
                }}
                onClose={() => setShowSeasonPicker(false)}
              />
            </ScrollView>

            {/* Start Game */}
            <Pressable
              style={[
                styles.startButton,
                (!yourTeam || !oppositionTeam) && { opacity: 0.5 },
              ]}
              disabled={!yourTeam || !oppositionTeam}
              onPress={startGame}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  scrollContent: {
    maxHeight: "70%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  startButton: {
    marginTop: 16,
    backgroundColor: "#12c2e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  selectRow: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  selectText: {
    fontSize: 16,
  },
  placeholderText: {
    color: "#999",
  },
});
