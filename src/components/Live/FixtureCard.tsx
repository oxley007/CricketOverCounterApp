import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ResumeButton from "./LiveGameButton";

type Props = {
  fixture: any;
};

export default function FixtureCard({ fixture }: Props) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.title}>
        {fixture.yourTeam?.name} vs {fixture.oppositionTeam?.name}
      </Text>

      {/* Status */}
      <Text style={styles.status}>
        {fixture.completed ? "Completed" : "Live / In Progress"}
      </Text>

      {/* Meta row */}
      <Text style={styles.meta}>
        Season {fixture.season} • Total Overs {fixture.overs}
      </Text>

      {/* Date */}
      <Text style={styles.date}>{new Date(fixture.date).toLocaleString()}</Text>
      {!fixture.completed && <ResumeButton teamId={fixture.yourTeam?.id} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,

    // subtle elevation
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    color: "#12c2e9",
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
});
