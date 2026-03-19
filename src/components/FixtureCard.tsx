// src/components/FixtureCard.tsx

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function FixtureCard({ fixture, onPress, isFreeFixture }: any) {
  const proUnlocked = useMatchStore((s) => s.proScorebookUnlocked);

  const innings = Array.isArray(fixture.innings) ? fixture.innings : [];

  const yourTeam = fixture.yourTeam?.name ?? "Your Team";
  const oppTeam = fixture.oppositionTeam?.name ?? "Opponent";

  const inningsSummary = innings
    .filter((i: any) => i.battingTeamId)
    .map((i: any) => {
      const name = i.battingTeamId === fixture.yourTeam.id ? yourTeam : oppTeam;

      return `${name} ${i.totalRuns}/${i.totalWickets}`;
    });

  const result = fixture.result;

  let resultText = "No result";

  if (result) {
    if (result.type === "abandoned") {
      resultText = "Match abandoned";
    } else if (result.isDraw) {
      resultText = result.margin ?? "Match drawn";
    } else if (result.winnerTeamId) {
      const winnerName =
        result.winnerTeamId === fixture.yourTeam.id ? yourTeam : oppTeam;

      resultText = `${winnerName} ${result.margin?.toLowerCase()}`;
    }
  }

  const date = fixture.date
    ? new Date(fixture.date).toLocaleDateString()
    : "Unknown date";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {!proUnlocked && !isFreeFixture && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      )}
      <Text style={styles.date}>{date}</Text>

      <Text style={styles.opponent}>vs {oppTeam}</Text>

      <View style={styles.scoreBlock}>
        {inningsSummary.map((line: string, i: number) => (
          <Text key={i} style={styles.scoreLine}>
            {line}
          </Text>
        ))}
      </View>

      <Text style={styles.result}>{resultText}</Text>
      <Text style={styles.tapFor}>
        {proUnlocked || isFreeFixture
          ? "(Tap for Scorecard)"
          : "(Tap to upgrade to Pro to view scorecard)"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },

  date: {
    fontSize: 14,
    color: "#666",
  },

  opponent: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 8,
  },

  scoreBlock: {
    marginBottom: 8,
  },

  scoreLine: {
    fontSize: 16,
  },

  result: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  tapFor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999",
    paddingTop: 5,
  },
  proBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ff7043",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  proBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
