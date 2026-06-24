import { Alert } from "react-native";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";
import { useFeedback } from "../hooks/useFeedback";

export function useUndoAction() {
  const undoLastEvent = useMatchStore((s) => s.undoLastEvent);
  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  const triggerTap = useFeedback().triggerTap;

  return () => {
    triggerTap();

    const events = useMatchStore.getState().events;
    if (!events.length) return;

    const lastEvent = events[events.length - 1];

    if (lastEvent.type === "wicket") {
      Alert.alert("Undo Not Allowed", "You cannot undo after a wicket.");
      return;
    }

    const { ballsThisOver } = buildCurrentOverCircles(events, {
      wideIsExtraBall,
    });

    // 🔍 DIAGNOSTIC LOG: Capture data BEFORE undo execution
    console.log("=== UNDO TRIGGERED ===");
    console.log("Balls this over before undo:", ballsThisOver);
    console.log("Last event type to be removed:", lastEvent.type);
    console.log(
      "BEFORE UNDO - Store Bowler ID:",
      useGameStore.getState().currentGame?.currentBowlerId,
    );
    console.log(
      "BEFORE UNDO - Store Batting Team ID:",
      useGameStore.getState().currentGame?.battingTeamId,
    );

    // Execute the undo
    undoLastEvent(ballsThisOver - 1);

    // Execute the store reset
    useGameStore.getState().resetCurrentBowlerAfterUndo();

    // 🔍 DIAGNOSTIC LOG: Capture data AFTER undo execution completes
    console.log(
      "AFTER UNDO - Store Bowler ID:",
      useGameStore.getState().currentGame?.currentBowlerId,
    );
    console.log(
      "AFTER UNDO - Store Batting Team ID:",
      useGameStore.getState().currentGame?.battingTeamId,
    );
    console.log("======================");
  };
}
