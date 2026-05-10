import { Alert } from "react-native";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";
import { useFeedback } from "../hooks/useFeedback";

export function usePlusAction({
  isScorebook,
  setModalVisible,
  setRetireOnlyMode,
}: {
  isScorebook: boolean;
  setModalVisible: (v: boolean) => void;
  setRetireOnlyMode: (v: boolean) => void;
}) {
  const triggerTap = useFeedback().triggerTap;

  return () => {
    triggerTap();

    const gameState = useGameStore.getState();
    const matchState = useMatchStore.getState();

    const currentGame = gameState.currentGame;
    if (!currentGame) return;

    const events = matchState.events || [];
    const wideIsExtraBall = matchState.wideIsExtraBall;

    const { ballsThisOver: actualBallsThisOver } = buildCurrentOverCircles(
      events,
      {
        wideIsExtraBall,
      },
    );

    const currentBowlerId = currentGame.currentBowlerId;
    const lastBowlerId = currentGame.lastBowlerId;

    const wicketsAsNegativeRuns = matchState.wicketsAsNegativeRuns;

    const ballsThisOverFromGame = currentGame?.ballsThisOver ?? 0;

    // ---------------- LOG ----------------
    console.log("=== BALLS LOG ===");
    console.log("ActionTabs ballsThisOver:", ballsThisOverFromGame);
    console.log("actualBallsThisOver:", actualBallsThisOver);
    console.log("currentBowlerId:", currentBowlerId);
    console.log("lastBowlerId:", lastBowlerId);
    console.log("=================");

    // ---------------- GUARDS ----------------

    if (!isScorebook && !currentGame.battingTeamId) {
      Alert.alert(
        "Teams Required",
        "Please select the batting team before you start scoring.",
      );
      return;
    }

    if (isScorebook && !currentBowlerId) {
      Alert.alert("Please add a bowler to continue");
      return;
    }

    const activeStriker = currentGame.activeBatters?.find(
      (b) => b.playerId === currentGame.currentStrikeId,
    );

    if (isScorebook && !activeStriker) {
      Alert.alert("Please select the facing batter to continue");
      return;
    }

    if (
      isScorebook &&
      actualBallsThisOver >= 6 &&
      currentBowlerId === lastBowlerId
    ) {
      Alert.alert(
        "Over Complete",
        wicketsAsNegativeRuns
          ? "This over is complete.\n\nAdd the next bowler to continue scoring.\nIf you need to end the current partnership, you can continue."
          : "This over is complete.\n\nAdd the next bowler to continue scoring.\nIf you need to retire a batter, you can continue.",
        [
          {
            text: "Back to add a Bowler",
            style: "cancel",
          },
          {
            text: wicketsAsNegativeRuns
              ? "Continue to End Partnership"
              : "Continue to Retire Batter",
            onPress: () => {
              setRetireOnlyMode(true);
              setModalVisible(true);
            },
          },
        ],
      );

      return;
    }

    // ---------------- ACTION ----------------
    setModalVisible(true);
  };
}
