import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";

import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";

export default function TestGameSetupWithNewInnings() {
  const [log, setLog] = useState("");

  // Live store resets
  const resetInnings = useMatchStore((s) => s.resetInnings);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetBatters = useGameStore((s) => s.resetBatters);
  const saveCurrentInnings = useFixtureStore((s) => s.saveCurrentInnings);

  const handleTestSetup = () => {
    const fixtureStore = useFixtureStore.getState();
    const fixture = fixtureStore.currentFixture;

    if (!fixture) {
      console.warn("⚠️ No current fixture");
      return;
    }

    console.log(
      "🏏 Current fixture BEFORE any changes:",
      JSON.stringify(fixture, null, 2),
    );
    console.log(
      "📊 Current game BEFORE any changes:",
      useGameStore.getState().currentGame,
    );

    // ======= Save current innings =======
    saveCurrentInnings();
    console.log("💾 Saved current innings");

    // ======= Add new blank innings =======
    const inningsNumber = fixture.innings.length + 1;
    const newInnings = {
      inningsNumber,
      battingTeamId: "",
      bowlingTeamId: "",
      matchEvents: [],
      battingEntries: [],
      bowlers: [],
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
    };

    useFixtureStore.setState({
      currentFixture: {
        ...fixture,
        innings: [...fixture.innings, newInnings],
      },
    });

    console.log("✅ Added new innings to fixtureStore");
    console.log(
      "📝 Fixture AFTER adding new innings:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );

    // ======= Reset live stores =======
    resetInnings();
    resetGame();
    resetBatters();
    console.log("🔄 Reset live stores: innings, game, batters");

    // ======= Now run your exact existing Test Game Setup code =======
    const yourTeam = fixture.yourTeam;
    const oppositionTeam = fixture.oppositionTeam;
    const overs = fixture.overs ?? 20;
    const season = fixture.season ?? useGameStore.getState().lastSeason ?? "";

    console.log("⚔️ Teams and config:");
    console.log("Your Team:", yourTeam);
    console.log("Opposition Team:", oppositionTeam);
    console.log("Overs:", overs, "Season:", season);

    const matchStore = useMatchStore.getState();
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
      "⚙️ Game config set in store:",
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

    console.log(
      "📌 Final fixture state:",
      JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
    );
    console.log(
      "📌 Final currentGame state:",
      useGameStore.getState().currentGame,
    );
  };

  return (
    <View style={{ padding: 16 }}>
      <Button mode="contained" onPress={handleTestSetup}>
        Test Game Setup + New Innings
      </Button>
      {log ? <Text style={{ marginTop: 12 }}>{log}</Text> : null}
    </View>
  );
}
