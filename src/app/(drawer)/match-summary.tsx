// app/match-summary.tsx

import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import InningsTabs from "../../components/InningsTabs";
import { useFixtureStore } from "../../state/fixtureStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useUIStore } from "../../state/uiStore";

export default function MatchSummaryScreen() {
  const { fixtureId, prevMode } = useLocalSearchParams<{
    fixtureId?: string | string[];
    prevMode?: string;
  }>();
  const setSaving = useUIStore((s) => s.setSaving);
  const fixtureIdStr = Array.isArray(fixtureId) ? fixtureId[0] : fixtureId;
  const fixture = useFixtureStore((s) => {
    // Prefer currentFixture when it matches the requested fixtureId (or when no id was passed)
    if (s.currentFixture) {
      if (!fixtureIdStr || s.currentFixture.id === fixtureIdStr) {
        return s.currentFixture;
      }
    }

    if (fixtureIdStr) {
      const found = s.fixtures.find((f) => f.id === fixtureIdStr);
      if (found) return found;
    }

    return s.currentFixture;
  });

  // This ensures isResetView is only true if we EXPLICITLY pass
  // something that isn't "scorebook" (like "quick" or "reset")
  const isResetView = prevMode && prevMode !== "scorebook";

  useEffect(() => {
    setSaving(false);
  }, [setSaving]);

  if (!fixture && !isResetView) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Match Summary</Text>
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Fixture not found.
        </Text>
      </View>
    );
  }

  // -----------------------------
  // Only compute innings/result if fixture exists
  // -----------------------------
  let inningsSummary: string[] = [];
  let resultText = "No result";

  if (!isResetView && fixture) {
    const innings = Array.isArray(fixture.innings) ? fixture.innings : [];

    inningsSummary = innings
      .filter((inn) => inn.battingTeamId)
      .map((inn) => {
        const teamName =
          inn.battingTeamId === fixture.yourTeam.id
            ? fixture.yourTeam.name
            : inn.battingTeamId === fixture.oppositionTeam.id
              ? fixture.oppositionTeam.name
              : "UNKNOWN";

        return `${teamName} ${inn.totalRuns}/${inn.totalWickets}`;
      });

    const result = fixture.result;

    if (result) {
      if (result.type === "abandoned") {
        resultText = "Match abandoned";
      } else if (result.isDraw) {
        resultText = result.margin ?? "Match drawn";
      } else if (result.winnerTeamId) {
        const winnerName =
          result.winnerTeamId === fixture.yourTeam.id
            ? fixture.yourTeam.name
            : fixture.oppositionTeam.name;

        resultText = `${winnerName} ${result.margin?.toLowerCase()}`;
      }
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isResetView ? "Counter Reset" : "Match Summary",
          headerBackVisible: false,
        }}
      />

      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          {isResetView ? (
            // WHAT TO SHOW IF NOT SCOREBOOK
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={styles.title}>Ball Counter Reset</Text>
              <Text style={{ color: "#fff", marginBottom: 20 }}>
                The match data was cleared successfully.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Match Summary</Text>

              {/* Innings summary card */}
              <View style={styles.card}>
                {inningsSummary.map((line, idx) => (
                  <Text key={idx} style={styles.inningsLine}>
                    {line}
                  </Text>
                ))}
              </View>

              {/* Result */}
              <Text style={styles.result}>{resultText}</Text>

              {/* Tabs */}
              <View style={styles.card}>
                <InningsTabs fixture={fixture!} />
              </View>
            </>
          )}

          <Button
            mode="contained"
            onPress={() => {
              useFixtureStore.setState({ currentFixture: undefined });

              const startModal = useStartModalStore.getState();
              startModal.reset();
              startModal.open();

              router.replace("/");
            }}
            style={styles.continueButton}
          >
            Continue
          </Button>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#12c2e9",
  },

  container: {
    padding: 20,
    paddingBottom: 120,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  inningsLine: {
    fontSize: 18,
    marginVertical: 4,
    textAlign: "center",
  },

  result: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
    marginBottom: 20,
  },

  continueButton: {
    borderRadius: 10,
    marginTop: 10,
  },
});
