import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "react-native-paper"; // Imported Paper Card
import { useMatchStore } from "../../state/matchStore";
import { buildCurrentOverCircles } from "../../utils/currentOverUtils";
import { BallCircle } from "./BallCircle";
import { styles as localStyles } from "./styles"; // Keep your exact layout dimensions

export const CurrentOverDisplay = () => {
  const events = useMatchStore((s) => s.events);
  const { circles } = buildCurrentOverCircles(events, {
    wideIsExtraBall: true,
  });

  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  console.log("wideIsExtraBall =", wideIsExtraBall);

  return (
    <Card style={paperStyles.card} mode="elevated">
      {/* 
        We use your original styles.container layout here. 
        This keeps your heights, widths, and circle alignments identical.
      */}
      <View style={localStyles.container}>
        {circles.map((item, i) => (
          <BallCircle key={i} item={item as any} />
        ))}
      </View>
    </Card>
  );
};

// Isolated card aesthetics to avoid layout pollution
const paperStyles = StyleSheet.create({
  card: {
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Slightly darker version of #12c2e9
    height: "auto", // Prevents stretching
    alignSelf: "stretch", // Adapts to parent width without growing vertically
    padding: 12, // Replaces the missing Card.Content default padding
  },
});
