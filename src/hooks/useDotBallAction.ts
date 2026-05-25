import { Alert } from "react-native";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
//import { useFixtureStore } from "../state/fixtureStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";
import { useFeedback } from "../hooks/useFeedback";
//import { syncLiveGame } from "../services/firestoreService";

export function useDotBallAction(isScorebook: boolean) {
  const triggerTap = useFeedback().triggerTap;
  const addEvent = useMatchStore((s) => s.addEvent);

  return () => {
    triggerTap();

    const gameState = useGameStore.getState();
    const matchState = useMatchStore.getState();

    const currentGame = gameState.currentGame;

    if (!currentGame) {
      console.log("❌ No currentGame");
      return;
    }

    const strikerId = currentGame.currentStrikeId;
    const bowlerId = currentGame.currentBowlerId;

    if (!strikerId && isScorebook) {
      console.log("❌ No strikerId");
      return;
    }

    if (!bowlerId && isScorebook) {
      Alert.alert("Please select a bowler to continue");
      return;
    }

    const activeStriker = currentGame.activeBatters?.find(
      (b) => b.playerId === strikerId,
    );

    if (isScorebook && !activeStriker) {
      Alert.alert("Please select the facing batter to continue");
      return;
    }

    const events = matchState.events || [];
    const wideIsExtraBall = matchState.wideIsExtraBall;

    const { ballsThisOver } = buildCurrentOverCircles(events, {
      wideIsExtraBall,
    });

    const lastBowlerId = currentGame.lastBowlerId;

    // 🚨 OVER GUARD (same logic as original)
    if (isScorebook && ballsThisOver >= 6 && bowlerId === lastBowlerId) {
      Alert.alert("Please add the next bowler to continue");
      return;
    }

    const countsAsBall = true;

    // ---------------- EVENT ----------------
    addEvent({
      type: "ball",
      batterId: strikerId,
      batterInningId: activeStriker?.batterInningId || "",
      bowlerId,
      runs: 0,
      isExtra: false,
      countsAsBall,
      runBreakdown: { bat: 0, extras: 0 },
      prevBatterId: strikerId,
    });

    // ---------------- BATTER ----------------
    if (!strikerId) return;
    gameState.updateBatterStats(strikerId, 0, 1);

    // ---------------- BOWLER ----------------
    if (bowlerId) {
      gameState.updateBowlerStats(bowlerId, 0, 1, 0, undefined);
    }

    // ---------------- STRIKE CHANGE ----------------
    gameState.applyStrikeChange({
      bat: 0,
      extras: 0,
      countsAsBall,
      runs: 0,
    });

    // after all updates
    /*
    const game = useGameStore.getState().currentGame;
    const fixture = useFixtureStore.getState().currentFixture;

    if (game && fixture?.yourTeam?.id) {
      syncLiveGame(fixture.yourTeam.id, game);
    }
    */

    console.log("✅ Dot ball applied successfully");
  };
}
