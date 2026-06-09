import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

type Props = {
  delta: number; // +4, -5, etc
  onComplete?: () => void;
};

export default function ScoreDelta({ delta, onComplete }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -12,
          duration: 2900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2900,
          delay: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete?.());
  }, [delta]);

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isPositive ? "#444" : isNegative ? "#d32f2f" : "#fff", // lighter green
            fontSize: isPositive ? 34 : 30,
          },
        ]}
      >
        {isPositive ? `+${delta}` : delta}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
  },
  text: {
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
