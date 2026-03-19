// src/components/EndGameModal.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";

import InningsTabs from "./InningsTabs";
import { Fixture } from "../state/fixtureStore";
import { useStartModalStore } from "../state/startModalStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  fixture: Fixture; // <- snapshot passed from parent
};

export default function EndGameModal({ visible, onClose, fixture }: Props) {
  if (!fixture) return null;
  //const fixture = useFixtureStore((s) => s.currentFixture);

  // Build innings summary lines
  const inningsSummary = fixture.innings
    .filter((inn) => inn.battingTeamId) // only played innings
    .map((inn, index) => {
      const teamName =
        inn.battingTeamId === fixture.yourTeam.id
          ? fixture.yourTeam.name
          : inn.battingTeamId === fixture.oppositionTeam.id
            ? fixture.oppositionTeam.name
            : "UNKNOWN";

      return `${teamName} ${inn.totalRuns}/${inn.totalWickets}`;
    });

  // Determine result
  let resultText = "No result";
  if (fixture.completed) {
    const totals = fixture.innings
      .filter((inn) => inn.battingTeamId)
      .reduce(
        (acc, inn) => {
          if (inn.battingTeamId === fixture.yourTeam.id) {
            acc.yourTeam += inn.totalRuns;
          } else if (inn.battingTeamId === fixture.oppositionTeam.id) {
            acc.opposition += inn.totalRuns;
          }
          return acc;
        },
        { yourTeam: 0, opposition: 0 },
      );

    if (totals.yourTeam > totals.opposition)
      resultText = `${fixture.yourTeam.name} win`;
    else if (totals.opposition > totals.yourTeam)
      resultText = `${fixture.oppositionTeam.name} win`;
    else resultText = "Draw / Tie";
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>Match Summary</Text>

        <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
          {inningsSummary.map((line, idx) => (
            <Text key={idx} style={styles.inningsLine}>
              {line}
            </Text>
          ))}
        </ScrollView>

        <Text style={styles.result}>{resultText}</Text>

        <View style={{ maxHeight: 320, marginVertical: 8 }}>
          <InningsTabs fixture={fixture} />
        </View>

        <Button
          mode="contained"
          onPress={() => {
            onClose();
            useStartModalStore.getState().reset();
          }}
          style={styles.continueButton}
        >
          Continue
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    zIndex: 1000,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  inningsLine: {
    fontSize: 16,
    marginVertical: 2,
  },
  result: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
    textAlign: "center",
  },
  continueButton: {
    marginTop: 10,
    borderRadius: 8,
  },
});
