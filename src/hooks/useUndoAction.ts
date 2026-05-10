import { Alert } from "react-native";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils"; // <- import here
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

    undoLastEvent(ballsThisOver - 1);

    useGameStore.getState().resetCurrentBowlerAfterUndo();
  };
}
