import React from "react";
import { Button } from "react-native-paper";
import { useMatchStore } from "../state/matchStore";

export default function DotBallButton() {
  const { addBall } = useMatchStore();

  const handlePress = () => {
    addBall({ runs: 0, isExtra: false, countsAsBall: true });
  };

  return (
    <Button mode="contained" onPress={handlePress}>
      Dot Ball (0 runs)
    </Button>
  );
}
