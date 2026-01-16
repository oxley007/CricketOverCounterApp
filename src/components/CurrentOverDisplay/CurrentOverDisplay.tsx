import React from "react";
import { View, Text } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import { buildCurrentOverCircles } from "../../utils/currentOverUtils";
import { BallCircle } from "./BallCircle";
import { styles } from "./styles";

export const CurrentOverDisplay = () => {
  const events = useMatchStore((s) => s.events);
  const { circles, isFirstBall } = buildCurrentOverCircles(events);

  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  console.log("wideIsExtraBall =", wideIsExtraBall);

  return (
    <View>
      <View style={styles.container}>
        {circles.map((item, i) => (
          <BallCircle key={i} item={item as any} />
        ))}
      </View>
    </View>
  );
};
