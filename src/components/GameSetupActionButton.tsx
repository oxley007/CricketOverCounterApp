import React from "react";
import { Button } from "react-native-paper";

import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";

type Props = {
  label?: string;
  onComplete?: () => void;
};

export default function GameSetupActionButton({
  label = "Start Game",
  onComplete,
}: Props) {
  const handleSetup = () => {
    const fixture = useFixtureStore.getState().currentFixture;
    if (!fixture) {
      console.warn("No current fixture");
      return;
    }

    // 1️⃣ Grab teams, overs, and season
    const yourTeam = fixture.yourTeam;
    const oppositionTeam = fixture.oppositionTeam;
    const overs = fixture.overs ?? 20;
    const season = fixture.season ?? useGameStore.getState().lastSeason ?? "";

    if (!yourTeam || !oppositionTeam) {
      console.warn("Missing teams in fixture");
      return;
    }

    // 2️⃣ Grab match rules settings
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

    // 🟢 IMPORTANT: determine if brand new BEFORE marking setup complete
    const isNewGame = !useGameStore.getState().isSetupComplete;

    // 3️⃣ Save game config
    useGameStore.getState().setGameConfig({
      yourTeam: { id: yourTeam.id, name: yourTeam.name },
      oppositionTeam: { id: oppositionTeam.id, name: oppositionTeam.name },
      overs: overs === "Unlimited" ? 0 : parseInt(String(overs), 10),
      season,
    });

    // 4️⃣ Start fixture
    useFixtureStore.getState().startFixture();

    // 5️⃣ Save last season
    useGameStore.getState().setLastSeason(season);

    // 6️⃣ Mark setup complete
    useGameStore.getState().setSetupComplete(true);

    // 7️⃣ Apply match rules
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

    // 8️⃣ Trigger modal if needed
    if (isNewGame) {
      useMatchStore.getState().openMatchRulesModal();
    }

    onComplete?.();
  };

  return (
    <Button mode="contained" onPress={handleSetup}>
      {label}
    </Button>
  );
}
