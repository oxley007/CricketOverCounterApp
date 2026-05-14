import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import { auth } from "../services/firebaseConfig";
import {
  saveFixture,
  saveTeamWithPlayers,
  clearLiveEvents,
  saveLiveFixture,
  updateLiveData,
  updateCurrentGameData,
} from "../services/firestoreService";
import { useAuthStore } from "../state/authStore";
import { useFixtureStore } from "../state/fixtureStore";
import { useLiveStore } from "../state/liveStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";
import AuthModal from "./AuthModal";

//import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

type Props = {
  onComplete?: () => void; // parent can close modal
};

export default function NewInningsButton({ onComplete }: Props) {
  const [log, setLog] = useState("");

  // Live store resets
  //const resetInnings = useMatchStore((s) => s.resetInningsOnly);
  //const resetGame = useGameStore((s) => s.resetGame);
  //const resetBatters = useGameStore((s) => s.resetBatters);
  const saveCurrentInnings = useFixtureStore((s) => s.saveCurrentInnings);

  const [authVisible, setAuthVisible] = useState(false);

  //const isGuest = useAuthStore((s) => s.isGuest);

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
          if (auth.currentUser || state.isGuest) {
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
      return Promise.resolve();
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

      // ✅ Clear live Firebase events (match is finished / new innings reset)
      const liveStore = useLiveStore.getState();

      console.log(JSON.stringify(liveStore), "cehck liveStore");

      const liveTeam = liveStore.teams.find(
        (t) => t.teamId === currentFixture.yourTeam?.id,
      );

      console.log(liveStore.teamCode, "cehck liveStore.teamCode");

      if (liveStore.teamCode) {
        try {
          await clearLiveEvents(liveTeam.teamCode);
        } catch (e) {
          console.warn("⚠️ Failed to clear live events:", e);
        }
      }

      if (liveStore.teamId) {
        try {
          await saveLiveFixture(liveTeam.teamId, currentFixture);
        } catch (e) {
          console.warn("⚠️ Failed to save public fixture:", e);
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
    // 1️⃣ Reset guest if needed
    resetGuestIfNeeded();

    // 2️⃣ Grab stores
    const fixtureStore = useFixtureStore.getState();
    const matchStore = useMatchStore.getState();
    const fixture = fixtureStore.currentFixture;

    if (!fixture) return;

    console.log("🔹 Starting test setup for fixture:", fixture.id);

    // 3️⃣ Save current innings (SOURCE OF TRUTH)
    console.log("💾 Saving current innings...");
    saveCurrentInnings();

    console.log(
      "📌 Fixture after save:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );

    // 4️⃣ Extract teams, overs, season (after save)
    const updatedFixture = useFixtureStore.getState().currentFixture;
    if (!updatedFixture) return;

    const yourTeam = updatedFixture.yourTeam;
    const oppositionTeam = updatedFixture.oppositionTeam;
    const overs = updatedFixture.overs ?? 20;
    const season =
      updatedFixture.season ?? useGameStore.getState().lastSeason ?? "";

    console.log("⚔️ Teams and config:");
    console.log("Your Team:", yourTeam);
    console.log("Opposition Team:", oppositionTeam);
    console.log("Overs:", overs, "Season:", season);

    // 5️⃣ Pull match rules BEFORE we reset anything else
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

    // 6️⃣ Setup next game (CRITICAL: before addInnings)
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

    useGameStore.getState().setLastSeason(season);
    useGameStore.getState().setSetupComplete(true);

    console.log("✅ Setup marked complete");

    // 7️⃣ Apply match rules cleanly
    const isNewGame = false; // we just set setupComplete → not a new game

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

    // 8️⃣ Prepare new innings batting entries
    const nextBattingTeamId =
      (updatedFixture.innings.length + 1) % 2 === 1
        ? yourTeam.id
        : oppositionTeam.id;

    // Get all teams from store
    const teams = useTeamStore.getState().teams;

    // Get players for this team
    const nextTeam = teams.find((t) => t.id === nextBattingTeamId);
    const battingEntries =
      nextTeam?.players.map((p) => ({
        playerId: p.id,
        entryId: `${p.id}-${Date.now()}`, // unique per innings
        dismissal: null,
      })) ?? [];

    // Add next innings with prepared batters
    useFixtureStore.getState().addInnings(battingEntries);
    console.log("➕ New innings added with batting entries");

    console.log(
      "📌 Fixture after adding innings:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );

    // 9️⃣ Log summary (unchanged)
    setLog(
      `✅ Game setup complete with new innings.\n` +
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
      "🔹 currentGame being saved:",
      useGameStore.getState().currentGame,
    );

    // 🔟 Save to Firebase if scorebook mode
    //if (isScorebook) {
    await saveNewInningsFixture();
    console.log("💾 New innings saved to Firebase");
    //}

    console.log("💾 Fixture saved successfully!");

    console.log(
      "📌 Final fixture state:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );

    console.log(
      "📌 Final currentGame state:",
      useGameStore.getState().currentGame,
    );

    try {
      console.log("💾 Saving fixture to Firestore... ballCounter", fixture.id);

      // ✅ Clear live Firebase events (match is finished / new innings reset)
      const liveStore = useLiveStore.getState();

      console.log(JSON.stringify(liveStore), "cehck liveStore ballCounter");

      const liveTeam = liveStore.teams.find(
        (t) => t.teamId === fixture.yourTeam?.id,
      );

      console.log(liveStore.teamCode, "cehck liveStore.teamCode ballCounter");

      if (liveStore.teamCode) {
        try {
          await clearLiveEvents(liveStore.teamCode);
        } catch (e) {
          console.warn("⚠️ Failed to clear live events ballCounter:", e);
        }
      }

      if (liveStore.teamCode) {
        try {
          const latestFixture = useFixtureStore.getState().currentFixture;
          const latestGame = useGameStore.getState().currentGame;

          console.log(
            "🚀 SENDING TO FIREBASE:",
            JSON.stringify(latestFixture?.innings, null, 2),
          );

          await saveLiveFixture(liveStore.teamCode, latestFixture);
          await updateLiveData(liveStore.teamCode, latestFixture);
          await updateCurrentGameData(liveStore.teamCode, latestGame);
        } catch (e) {
          console.warn("⚠️ Failed to save public fixture ballCounter:", e);
        }
      }
    } catch (err) {
      console.error("❌ Error in saveNewInningsFixture ballCounter:", err);
      Alert.alert(
        "Error",
        "Failed to save new innings. Check console for details ballCounter.",
      );
      throw err; // re-throw so parent knows
    }

    // 1️⃣1️⃣ Done
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
          try {
            if (!isScorebook) {
              await handleTestSetup();
            } else {
              await requireAuth(handleTestSetup);
            }
          } catch (err) {
            console.error("❌ Add innings failed:", err);
          } finally {
            setSaving(false);
          }
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
