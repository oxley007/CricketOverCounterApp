// src/components/FixtureSummaryModal.tsx

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";

import InningsTabs from "./InningsTabs";

type Props = {
  visible: boolean;
  fixture: any;
  onClose: () => void;
};

export default function FixtureSummaryModal({
  visible,
  fixture,
  onClose,
}: Props) {
  // Convert innings object to array
  const inningsArray = fixture?.innings ? Object.values(fixture.innings) : [];

  console.log("⚡ Fixture passed to modal:", fixture);
  console.log("⚡ Fixture innings array:", inningsArray);

  // Build summary lines
  const inningsSummary = inningsArray
    .filter((inn) => inn.battingTeamId)
    .map((inn) => {
      const teamName =
        inn.battingTeamId === fixture?.yourTeam?.id
          ? fixture?.yourTeam?.name
          : fixture?.oppositionTeam?.name;

      return `${teamName} ${inn.totalRuns}/${inn.totalWickets}`;
    });

  const result = fixture?.result;

  let resultText = "No result";
  if (result) {
    if (result.type === "abandoned") {
      resultText = "Match abandoned";
    } else if (result.isDraw) {
      resultText = result.margin ?? "Match drawn";
    } else if (result.winnerTeamId) {
      const winnerName =
        result.winnerTeamId === fixture?.yourTeam?.id
          ? fixture?.yourTeam?.name
          : fixture?.oppositionTeam?.name;

      resultText = `${winnerName} ${result.margin?.toLowerCase()}`;
    }
  }

  return (
    <Portal>
      <Modal
        visible={visible && !!fixture}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <ScrollView>
          <Text style={styles.title}>Match Summary</Text>

          <View style={styles.card}>
            {inningsSummary.map((line, idx) => (
              <Text key={idx} style={styles.inningsLine}>
                {line}
              </Text>
            ))}
          </View>

          <Text style={styles.result}>{resultText}</Text>

          {fixture && (
            <View style={styles.card}>
              <InningsTabs
                // Pass the innings array directly from fixture
                fixture={{
                  ...fixture,
                  innings: Array.isArray(fixture.innings)
                    ? fixture.innings
                    : Object.values(fixture.innings),
                }}
              />
            </View>
          )}
        </ScrollView>

        <Button mode="contained" onPress={onClose}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 10,
    padding: 10,
    borderRadius: 12,
    maxHeight: "90%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    //padding: 16,
    marginBottom: 20,
  },
  inningsLine: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 4,
  },
  result: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
});
