import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void;
};

export default function ViewerLockedLiveScoresCard({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.lockedCard,
        pressed && styles.lockedCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.lockedCardContent}>
        {/* Changed background and icon to reflect locked state */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockedIcon}>🔒</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.lockedTitle}>
            Unlock ball-by-ball Live Scores
          </Text>
          <Text style={styles.lockedSubtitle}>
            Upgrade to Pro to follow every ball live
          </Text>
        </View>

        {/* Retained chevron to indicate action/button press */}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    // Neutral gray background indicating premium feature
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",

    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    marginTop: 20,
    marginBottom: 10,
  },
  lockedCardPressed: {
    opacity: 0.7,
  },
  lockedCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#E5E5EA",
    padding: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  lockedIcon: {
    fontSize: 18,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  lockedSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: "#AEAEB2",
    marginLeft: 10,
  },
});
