import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import { auth } from "../services/firebaseConfig";
import { saveFixture, saveTeamWithPlayers } from "../services/firestoreService";
import { useAuthStore } from "../state/authStore";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";
import AuthModal from "./AuthModal";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  onComplete?: () => void; // parent can close modal
};

export default function NewInningsButton({ onComplete }: Props) {
  const [log, setLog] = useState("");

  // Live store resets
  const resetInnings = useMatchStore((s) => s.resetInnings);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetBatters = useGameStore((s) => s.resetBatters);
  const saveCurrentInnings = useFixtureStore((s) => s.saveCurrentInnings);

  const [authVisible, setAuthVisible] = useState(false);

  const isGuest = useAuthStore((s) => s.isGuest);

  const [saving, setSaving] = useState(false);

  const selectedMode = useStartModalStore((s) => s.selectedMode);
  const isScorebook = selectedMode === "scorebook";

  const requireAuth = async (action: () => Promise<void>) => {
    const isGuest = useAuthStore.getState().isGuest;
    const guestMatchesPlayed = useAuthStore.getState().guestMatchesPlayed;

    // User not logged in
    if (!auth.currentUser && !isGuest) {
      await new Promise<void>((resolve) => {
        setAuthVisible(true);

        const unsubscribe = useAuthStore.subscribe((state) => {
          if (!state.isGuest && auth.currentUser) {
            unsubscribe();
            resolve();
          }
        });
      });

      await action();
      return;
    }

    // Block guest users who reached limit
    if (isGuest && guestMatchesPlayed >= 1) {
      Alert.alert(
        "Create a Free Account",
        "You've reached the guest match limit. Create a free account to continue saving matches and stats.",
        [{ text: "Sign Up", onPress: () => setAuthVisible(true) }],
      );
      return;
    }

    await action();
  };

  const saveNewInningsFixture = async () => {
    const fixtureStore = useFixtureStore.getState();
    const currentFixture = fixtureStore.currentFixture;

    if (!currentFixture) {
      console.warn("⚠️ No fixture to save for new innings");
      return;
    }

    // Assign ID if missing
    if (!currentFixture.id) {
      currentFixture.id = Date.now().toString();
      console.log("🆔 Assigned new fixture ID:", currentFixture.id);
    }

    try {
      console.log("💾 Saving fixture to Firestore...", currentFixture.id);

      // Save to Firestore (await!)
      await saveFixture(currentFixture);

      console.log("✅ Fixture saved remotely:", currentFixture.id);

      // Replace or append in local store so latest fixture (with all innings) wins
      useFixtureStore.setState((state) => ({
        fixtures: [
          ...state.fixtures.filter((f) => f.id !== currentFixture.id),
          currentFixture,
        ],
        currentFixture,
      }));

      console.log("💾 Fixture merged locally:", currentFixture.id);

      // Save teams and players used in this fixture (best-effort)
      const teams = useTeamStore.getState().teams;
      const yourTeam = currentFixture.yourTeam?.id
        ? teams.find((t) => t.id === currentFixture.yourTeam!.id)
        : null;
      const oppositionTeam = currentFixture.oppositionTeam?.id
        ? teams.find((t) => t.id === currentFixture.oppositionTeam!.id)
        : null;
      for (const team of [yourTeam, oppositionTeam]) {
        if (team) {
          try {
            await saveTeamWithPlayers(team);
            console.log("💾 Team saved:", team.name);
          } catch (e) {
            console.warn("⚠️ Failed to save team:", team.name, e);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error in saveNewInningsFixture:", err);
      Alert.alert(
        "Error",
        "Failed to save new innings. Check console for details.",
      );
      throw err; // re-throw so parent knows
    }
  };

  const handleTestSetup = async () => {
    resetGuestIfNeeded();

    const fixtureStore = useFixtureStore.getState();
    const matchStore = useMatchStore.getState(); // One declaration for the whole function
    const fixture = fixtureStore.currentFixture;

    if (!fixture) return;

    // 1. Capture current data - MUST define currentEvents here
    const currentEvents = [...matchStore.events];
    const finalInningsRuns = currentEvents.reduce(
      (sum, e) => sum + (e.runs || 0),
      0,
    );
    const finalInningsWickets = currentEvents.filter(
      (e) => e.type === "wicket",
    ).length;

    // 2. Identify the innings we are currently finishing
    const updatedInnings = [...fixture.innings];
    const finishedIdx = updatedInnings.length - 1;

    if (finishedIdx >= 0) {
      updatedInnings[finishedIdx] = {
        ...updatedInnings[finishedIdx],
        matchEvents: currentEvents,
        totalRuns: finalInningsRuns,
        totalWickets: finalInningsWickets,
      };
    }

    // 3. Create the blank placeholder for the next innings
    const newInnings = {
      inningsNumber: updatedInnings.length + 1,
      battingTeamId: "",
      bowlingTeamId: "",
      matchEvents: [],
      battingEntries: [],
      bowlers: [],
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
    };

    // 4. Update the store
    useFixtureStore.setState({
      currentFixture: {
        ...fixture,
        innings: [...updatedInnings, newInnings],
      },
    });

    // 5. Reset live tracking
    resetInnings();
    resetGame();
    resetBatters();

    console.log("🔄 Reset live stores: innings, game, batters");

    // ... rest of your setup code (setGameConfig, etc.)
    console.log("🔄 Reset live stores: innings, game, batters");
    console.log(
      "🔹 currentGame after reset:",
      useGameStore.getState().currentGame,
    );

    // ======= Now run your exact existing Test Game Setup code =======
    const yourTeam = fixture.yourTeam;
    const oppositionTeam = fixture.oppositionTeam;
    const overs = fixture.overs ?? 20;
    const season = fixture.season ?? useGameStore.getState().lastSeason ?? "";

    console.log("⚔️ Teams and config:");
    console.log("Your Team:", yourTeam);
    console.log("Opposition Team:", oppositionTeam);
    console.log("Overs:", overs, "Season:", season);

    //const matchStore = useMatchStore.getState();
    const {
      wideIsExtraBall,
      wideExtraBallThreshold,
      wicketsAsNegativeRuns,
      wicketPenaltyRuns,
      wicketPenaltyAffectsBatter,
      wicketPenaltyAffectsBowler,
      baseRuns,
    } = matchStore;

    console.log("📏 Match rules from store:", matchStore);

    useGameStore.getState().setGameConfig({
      yourTeam: { id: yourTeam.id, name: yourTeam.name },
      oppositionTeam: { id: oppositionTeam.id, name: oppositionTeam.name },
      overs: overs === "Unlimited" ? 0 : parseInt(String(overs), 10),
      season,
    });

    console.log(
      "⚙️ Game config after setGameConfig:",
      useGameStore.getState().gameConfig,
    );

    useFixtureStore.getState().startFixture();
    console.log("🏁 Fixture started");

    useGameStore.getState().setLastSeason(season);
    useGameStore.getState().setSetupComplete(true);
    console.log("✅ Setup marked complete");

    const isNewGame = !useGameStore.getState().isSetupComplete;

    useMatchStore.setState({
      wideIsExtraBall,
      wideExtraBallThreshold,
      wicketsAsNegativeRuns,
      wicketPenaltyRuns,
      wicketPenaltyAffectsBatter,
      wicketPenaltyAffectsBowler,
      baseRuns,
      showMatchRulesModal: isNewGame,
    });
    console.log("📝 Applied match rules headless");

    if (isNewGame) {
      useMatchStore.getState().openMatchRulesModal();
      console.log("🖼 Opened match rules modal (new game)");
    }

    // 🔟 Log summary
    setLog(
      `✅ Test game setup complete with new innings.\n` +
        `Your team: ${yourTeam.name} (${yourTeam.id})\n` +
        `Opposition: ${oppositionTeam.name} (${oppositionTeam.id})\n` +
        `Overs: ${overs}\n` +
        `Season: ${season}\n\n` +
        `Match Rules:\n` +
        `- Wides as extra ball: ${wideIsExtraBall}\n` +
        `- Wide extra ball threshold: ${wideExtraBallThreshold}\n` +
        `- Wickets as negative runs: ${wicketsAsNegativeRuns}\n` +
        `- Wicket penalty runs: ${wicketPenaltyRuns}\n` +
        `- Apply negative runs to batter: ${wicketPenaltyAffectsBatter}\n` +
        `- Apply negative runs to bowler: ${wicketPenaltyAffectsBowler}\n` +
        `- Base runs: ${baseRuns}`,
    );

    console.log("💾 Saving fixture for user:", auth.currentUser?.uid);
    console.log(
      "🔹 fixture to save:",
      useFixtureStore.getState().currentFixture,
    );
    console.log(
      "🔹 currentGame being saved:",
      useGameStore.getState().currentGame,
    );

    if (isScorebook) {
      await saveNewInningsFixture();
      console.log("💾 New innings saved to Firebase");
    }
    console.log("💾 New innings saved to Firebase");
    console.log("💾 Fixture saved successfully!");

    console.log(
      "📌 Final fixture state:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );
    console.log(
      "📌 Final currentGame state:",
      useGameStore.getState().currentGame,
    );

    onComplete?.();
  };

  return (
    <View style={{ paddingBottom: 16 }}>
      <Button
        mode="contained"
        buttonColor="#12c2e9"
        disabled={saving}
        onPress={async () => {
          setSaving(true);
          if (!isScorebook) {
            await handleTestSetup(); // run local logic only
          } else {
            await requireAuth(handleTestSetup); // only scorebook needs auth
          }
          setSaving(false);
        }}
        style={styles.addInningsButton}
        labelStyle={styles.addInningsLabel}
        icon={() => <Icon name="plus-circle" size={18} color="#fff" />}
      >
        Add New Innings
      </Button>
      {log ? <Text style={{ marginTop: 12 }}>{log}</Text> : null}
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  addInningsButton: {
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 12,
    width: "100%",
  },
  addInningsLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
