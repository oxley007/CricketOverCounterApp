import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  saveSeason,
  ensurePublicTeamExists,
} from "../../services/firestoreService";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
//import { Team } from "../../state/teamStore";
import { useTeamStore } from "../../state/teamStore";
import type { Team } from "../../state/teamStore";
import SeasonPickerModal from "../Seasons/SeasonPickerModal"; // ✅ correct import
import TeamPickerModal from "../Teams/TeamPickerModal";
import { useLiveStore } from "../../state/liveStore";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function GameSetupModal({ visible, onClose }: Props) {
  const { setSetupComplete, setGameConfig } = useGameStore();

  const [showYourTeamPicker, setShowYourTeamPicker] = useState(false);
  const [yourTeam, setYourTeam] = useState<Team | null>(null);

  const [showOppositionPicker, setShowOppositionPicker] = useState(false);
  const [oppositionTeam, setOppositionTeam] = useState<Team | null>(null);

  const [overs, setOvers] = useState("20");
  const [isUnlimited, setIsUnlimited] = useState(false);

  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [season, setSeason] = useState<string>(() => {
    return useGameStore.getState().lastSeason || "";
  });

  useEffect(() => {
    if (visible) {
      setYourTeam(null);
      setOppositionTeam(null);
      setOvers("20");
      setSeason(useGameStore.getState().lastSeason || "");
    }

    return () => {
      // Cleanup: When the component unmounts, ensure everything is false
      setShowYourTeamPicker(false);
      setShowOppositionPicker(false);
      setShowSeasonPicker(false);
    };
  }, [visible]);

  const startGame = async () => {
    if (!yourTeam || !oppositionTeam) return;

    const finalOvers = isUnlimited ? 0 : parseInt(overs, 10) || 0;

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
      overs: finalOvers,
      season,
    });

    // ✅ 🔥 THIS IS THE KEY PART
    const liveStore = useLiveStore.getState();
    const liveConfigured = liveStore.liveConfigured;

    console.log(liveConfigured, "liveConfigured is?");
    console.log(JSON.stringify(liveStore), "liveStore is?");
    console.log(yourTeam.id, "yourTeam.id is?");

    //if (liveConfigured) {
    const teamStore = useTeamStore.getState();
    const team = teamStore.teams.find((t) => t.id === yourTeam.id);

    if (!team) return;

    //const teamCode = await ensurePublicTeamExists(team);

    liveStore.configureLive({
      teamId: team.id,
      teamCode: team.id, // ✅ keep RAW in store
      playerIds: liveStore.playerIds ?? [],
    });

    //console.log("🔴 Live configured for game:", teamCode);
    /*} else {
      console.log("⚪ Live not enabled");
    }*/

    // Add liveTeamID so it can be used as a reference to what team this game nbelongs to
    useMatchStore.getState().setLiveTeamId(yourTeam.id);

    // 2️⃣ Start fixture AFTER config exists
    useFixtureStore.getState().startFixture();

    // 3 Save last season in store
    useGameStore.getState().setLastSeason(season);

    // ✅ ALSO save to Firestore
    saveSeason(season);

    console.log("Game store after start:", useGameStore.getState());

    // 4 Mark setup complete (this closes GameSetupModal)
    setSetupComplete(true);

    // 5 Open settings modal (or whatever modal you want)
    useMatchStore.getState().openMatchRulesModal(); // ✅ this triggers your settings modal
  };

  const handleBack = () => {
    // Remove any partial fixture
    //useFixtureStore.setState({ currentFixture: undefined });

    // Reset game state
    //useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();

    // Reset start modal state
    const startModal = useStartModalStore.getState();
    startModal.reset();

    // Close setup modal
    onClose();

    // Navigate to root
    router.replace("/");

    // Open start modal after navigation
    setTimeout(() => {
      useStartModalStore.getState().open();
      //startModal.reset();
      startModal.open();
    }, 120);
  };

  return (
    <Modal
      // 1. THIS IS THE KEY FIX: Forces React to treat this as a brand new component
      key={visible ? "active-setup" : "inactive-setup"}
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* 2. pointerEvents="box-none" ensures the overlay itself doesn't catch touches */}
        <View style={styles.overlay} pointerEvents="box-none">
          <View
            style={styles.container}
            pointerEvents="auto" // Ensures the actual UI box catches touches
          >
            <Text style={styles.title}>Setup your game</Text>

            <ScrollView
              style={styles.scrollContent}
              keyboardShouldPersistTaps="handled" // Important if you used a keyboard earlier
            >
              {/* Your Team */}
              <Text style={styles.label}>Your Team</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => {
                  console.log("Opening Your Team Picker");
                  setShowYourTeamPicker(true);
                }}
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
                style={[
                  styles.input,
                  isUnlimited && styles.disabledInput, // 👈 Apply grey style when true
                ]}
                placeholder="Enter overs (1-100 or Unlimited)"
                value={overs}
                onChangeText={setOvers}
                keyboardType="numeric"
                editable={!isUnlimited}
              />
              <View style={styles.switchRow}>
                <Text style={styles.smallLabel}>Unlimited</Text>
                <Switch
                  value={isUnlimited}
                  onValueChange={(val) => {
                    setIsUnlimited(val);
                    if (val) setOvers("0"); // Set internal high value
                  }}
                />
              </View>

              {/* Season */}
              <Text style={styles.label}>Season</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => {
                  console.log("Opening Season Picker");
                  setShowSeasonPicker(true);
                }}
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
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Cancel</Text>
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
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "#eee",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallLabel: {
    fontSize: 12,
    marginRight: 8,
    color: "#666",
  },
  oversHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  unlimitedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  unlimitedText: {
    fontSize: 12,
    marginRight: 8,
    color: "#666",
  },
  disabledInput: {
    backgroundColor: "#e0e0e0", // Grey background
    color: "#888", // Dimmed text
    borderColor: "#ccc", // Lighter border
  },
  backButton: {
    //position: "absolute",
    //top: 12,
    //left: 12,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 20,
  },

  backButtonText: {
    fontSize: 16,
    color: "#666",
  },
});
