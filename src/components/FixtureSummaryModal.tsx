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
          {/* Page Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Match Summary</Text>
          </View>

          {/* Styled Banner Block matching Tailwind specification colors */}
          <View style={styles.bannerContainer}>
            <View style={styles.accentBar} />
            <Text style={styles.headerText}>Match Completed</Text>
            <Text style={styles.result}>{resultText}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>FINAL RESULT</Text>
            </View>
          </View>

          {/* Team Scores Comparison Card */}
          <View style={styles.scoresCard}>
            {inningsArray
              .filter((inn) => inn.battingTeamId)
              .map((inn, idx) => {
                const teamName =
                  inn.battingTeamId === fixture?.yourTeam?.id
                    ? fixture?.yourTeam?.name
                    : fixture?.oppositionTeam?.name;

                const scoreText = `${inn.totalRuns}/${inn.totalWickets}`;

                return (
                  <React.Fragment key={idx}>
                    {/* Render a subtle horizontal divider line before the second team item */}
                    {idx > 0 && <View style={styles.scoreSeparator} />}

                    <View style={styles.teamScoreRow}>
                      <View style={styles.teamInfoCol}>
                        <Text style={styles.teamNameText}>{teamName}</Text>
                      </View>
                      <View style={styles.scoreCol}>
                        <Text style={styles.displayScoreText}>{scoreText}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
          </View>

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
    backgroundColor: "#0b1326",
    margin: 10,
    padding: 10,
    borderRadius: 12,
    maxHeight: "90%",
  },
  card: {
    //backgroundColor: "#",
    borderRadius: 12,
    marginBottom: 20,
  },
  inningsLine: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 4,
  },
  bannerContainer: {
    backgroundColor: "#131b2e", // surface-container-low
    borderWidth: 1,
    borderColor: "#3d494e", // outline-variant
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginHorizontal: 4,
  },
  accentBar: {
    width: 48,
    height: 4,
    backgroundColor: "#7fdaff", // primary cyan accent
    borderRadius: 9999,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00c2f3", // primary-container bright blue
    marginBottom: 6,
    textAlign: "center",
  },
  result: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#dae2fd", // on-surface pale white text
    marginBottom: 12,
  },
  badgeContainer: {
    backgroundColor: "#2d3449", // surface-container-highest
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#7fdaff", // primary cyan
  },
  scoresCard: {
    backgroundColor: "#131b2e", // bg-surface-container-low
    borderWidth: 1,
    borderColor: "#3d494e", // border-outline-variant
    borderRadius: 12, // rounded-xl
    padding: 16, // p-container-padding-mobile (16px)
    marginBottom: 20,
    marginHorizontal: 4,
  },
  teamScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end", // items-end
  },
  teamInfoCol: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 8,
  },
  scoreCol: {
    flexDirection: "column",
    alignItems: "flex-end", // items-end
  },
  teamNameText: {
    fontSize: 20, // text-headline-md
    fontWeight: "600", // font-headline-md
    color: "#dae2fd", // text-on-surface
  },
  displayScoreText: {
    fontSize: 32, // Adjusted down slightly from 64px display-score for balanced modal spacing
    fontWeight: "800", // font-display-score
    color: "#dae2fd", // text-on-surface
    lineHeight: 36,
  },
  scoreSeparator: {
    height: 1, // h-px
    backgroundColor: "#3d494e", // bg-outline-variant
    opacity: 0.3, // opacity-30
    marginVertical: 16, // handles the flex gap spacing between rows
  },
  titleContainer: {
    marginBottom: 16, // mb-gutter (16px spacing from your tailwind configuration keys)
  },
  title: {
    fontSize: 24, // text-headline-lg-mobile (24px)
    fontWeight: "700", // font-headline-lg-mobile (700)
    color: "#00c2f3", // text-on-surface color code
    letterSpacing: -0.4, // tracking-tight feel on native platforms
  },
});
