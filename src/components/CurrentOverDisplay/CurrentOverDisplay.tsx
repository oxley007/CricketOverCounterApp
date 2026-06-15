import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Card } from "react-native-paper";
import { useMatchStore } from "../../state/matchStore";
import { buildCurrentOverCircles } from "../../utils/currentOverUtils";
import { BallCircle } from "./BallCircle";

export const CurrentOverDisplay = () => {
  const events = useMatchStore((s) => s.events);
  const { circles } = buildCurrentOverCircles(events, {
    wideIsExtraBall: true,
  });

  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  console.log("wideIsExtraBall =", wideIsExtraBall);

  // Calculate dynamic size metrics based on how many deliveries are in the over
  const totalItems = circles.length;
  // If there are more than 6 balls in the over, smoothly scale down from a 44px base size
  const dynamicSize =
    totalItems > 6 ? Math.max(30, 44 - (totalItems - 6) * 3) : 44;

  return (
    <Card style={styles.recentBallsCard} mode="elevated">
      <View>
        <Text style={styles.recentBallsHeading}>CURRENT OVER</Text>

        {/* ✅ FIXED: Changed ScrollView to a standard bounding View to force compression */}
        <View style={styles.recentBallsRow}>
          {circles.map((item, i) => (
            <View
              key={i}
              style={[
                styles.circleScaleWrapper,
                { width: dynamicSize, height: dynamicSize },
              ]}
            >
              <BallCircle item={item as any} />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  recentBallsCard: {
    marginVertical: 10,
    marginHorizontal: 4,
    //backgroundColor: "#0e9cb9",
    backgroundColor: "rgba(45, 52, 73, 0.7)",
    height: "auto",
    alignSelf: "stretch",
    padding: 12,
  },
  recentBallsHeading: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  recentBallsRow: {
    flexDirection: "row", // Horizontal layout row
    alignItems: "center",
    justifyContent: "flex-start", // Left aligned rows
    width: "100%", // Clamps container width tightly to the card borders
  },
  circleScaleWrapper: {
    // Dynamically managed dimensions above, slight right margin for standard spacing
    marginRight: 6,
  },
});
