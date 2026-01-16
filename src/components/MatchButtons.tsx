import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import DotBallButton from "./DotBallButton";
import CurrentOverDisplay from "./CurrentOverDisplay";
import { useMatchStore } from "../state/matchStore";

export default function MatchButtons() {
  const { addBall, addWicket, undoLastEvent, resetInnings } = useMatchStore();

  return (
    <View style={styles.container}>
      <CurrentOverDisplay />
      <DotBallButton />
      <Button
        mode="contained"
        onPress={() =>
          addBall({ runs: 1, isExtra: false, countsAsBall: true })
        }
      >
        1 Run
      </Button>
      <Button mode="contained" onPress={() => addWicket("bowled")}>
        Add Wicket
      </Button>
      <Button mode="outlined" onPress={undoLastEvent}>
        Undo
      </Button>
      <Button mode="outlined" onPress={resetInnings}>
        Reset
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
});
