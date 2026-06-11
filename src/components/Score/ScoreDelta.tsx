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

  // Theme-compliant colors that pop beautifully on the dark glass background
  const textColor = isPositive
    ? "#7fdaff" // Your vibrant 'primary' cyan token (or use "#4ade80" if you want a classic green)
    : isNegative
      ? "#ffb4ab" // Your theme's bright 'error' pink/red token so it stands out
      : "#dae2fd"; // Your theme's 'on-surface' off-white light token

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
            color: textColor,
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
    // Pushes the animated number slightly above your massive 64px score display
    top: -24,
    alignSelf: "center",
  },
  text: {
    fontFamily: "Plus Jakarta Sans", // Match the score dashboard typography profile
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.4)", // Darkened slightly for better readability over glass blur
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
