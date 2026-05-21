import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void;
};

export default function LiveScoresCard({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.liveCard,
        pressed && styles.liveCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.liveCardContent}>
        <Text style={styles.liveIcon}>🏏</Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.liveTitle}>Let fans follow every ball live</Text>
          <Text style={styles.liveSubtitle}>
            Share your match with supporters
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  liveCard: {
    backgroundColor: "#FFE082",
    borderRadius: 14,
    padding: 16,
    //marginTop: 12,

    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  liveCardPressed: {
    opacity: 0.85,
  },
  liveCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  liveSubtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: "#333",
    marginLeft: 10,
  },
});
