import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void;
};

export default function RemindSupportersCard({ onPress }: Props) {
  // 🚀 Local state to handle card dismissal
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <View style={styles.cardContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.liveCard,
          pressed && styles.liveCardPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.liveCardContent}>
          <Text style={styles.liveIcon}>📢</Text>

          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.liveTitle}>Remind Your Supporters</Text>
            <Text style={styles.liveSubtitle}>
              Let fans know they can follow every ball live on the app
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      {/* 🚀 Internal absolute positioned close button */}
      <Pressable
        style={styles.hideButton}
        onPress={() => setIsVisible(false)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Makes it easier to tap
      >
        <Text style={styles.hideText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "relative",
    // marginVertical: 6, // Optional: uncomment if you want spacing handled here
  },
  liveCard: {
    backgroundColor: "#FFE082",
    borderRadius: 14,
    padding: 16,
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
  // 🚀 Styling rules for the internal dismiss cross
  hideButton: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  hideText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#444",
  },
});
