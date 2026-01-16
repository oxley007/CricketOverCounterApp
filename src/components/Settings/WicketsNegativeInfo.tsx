// src/components/WicketsNegativeInfo.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WicketsNegativeInfo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Wickets as Negative Runs Enabled
      </Text>

      <Text style={styles.text}>
        When this rule is on, wickets are recorded as negative runs instead of standard wicket events.
      </Text>

      <Text style={styles.text}>
        To end a partnership, open the <Text style={styles.bold}>+ Scoring</Text> tab and select{" "}
        <Text style={styles.bold}>End Partnership</Text> (adds 2 wickets).
      </Text>

      <Text style={styles.text}>
        To end a single batter, select{" "}
        <Text style={styles.bold}>End Batter</Text> (adds 1 wicket).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "600",
  },
});
