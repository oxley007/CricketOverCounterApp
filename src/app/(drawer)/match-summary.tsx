// app/match-summary.tsx

import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import InningsTabs from "../../components/InningsTabs";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useUIStore } from "../../state/uiStore";
import { resetGuestIfNeeded } from "../../utils/authHelpers";

export default function MatchSummaryScreen() {
  const { fixtureId, prevMode } = useLocalSearchParams<{
    fixtureId?: string | string[];
    prevMode?: string;
  }>();
  const setSaving = useUIStore((s) => s.setSaving);
  const fixtureIdStr = Array.isArray(fixtureId) ? fixtureId[0] : fixtureId;

  // 🚀 THE FIX: Make the fixture resolver strict so a brand new match cannot pass here!
  const fixture = useFixtureStore((s) => {
    // 1. If an ID was explicitly passed via the URL route param, search for it
    if (fixtureIdStr) {
      if (s.currentFixture && s.currentFixture.id === fixtureIdStr) {
        return s.currentFixture;
      }
      const found = s.fixtures.find((f) => f.id === fixtureIdStr);
      if (found) return found;

      return null; // Don't fall back to an unrelated currentFixture if ID doesn't match
    }

    // 2. If NO ID was passed via route parameters, check if the current active fixture is completed
    if (s.currentFixture && s.currentFixture.completed) {
      return s.currentFixture;
    }

    // 3. Otherwise, explicitly return null to force the page to safe-exit
    return null;
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
              <Button
                mode="contained"
                onPress={() => {
                  // 1. Wipe match memory
                  useFixtureStore.setState({ currentFixture: undefined });

                  // 2. Reset the mode configuration setup values
                  const startModal = useStartModalStore.getState();
                  startModal.reset();
                  startModal.open();

                  // 🚀 THE FIX: Pass empty params configuration to drop the old match ID and modes
                  router.replace({
                    pathname: "/",
                    params: {
                      fixtureId: undefined,
                      prevMode: undefined,
                    },
                  });
                }}
                style={styles.continueButton}
              >
                Continue
              </Button>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Match Summary</Text>

              <Button
                mode="contained"
                onPress={() => {
                  // 1. Wipe match memory
                  useFixtureStore.setState({ currentFixture: undefined });

                  // 2. Reset the mode configuration setup values
                  const startModal = useStartModalStore.getState();
                  startModal.reset();
                  startModal.open();

                  // 🚀 THE FIX: Pass empty params configuration to drop the old match ID and modes
                  router.replace({
                    pathname: "/",
                    params: {
                      fixtureId: undefined,
                      prevMode: undefined,
                    },
                  });
                }}
                style={styles.continueButton}
              >
                Continue
              </Button>

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
              // 1. Wipe match memory
              useFixtureStore.setState({ currentFixture: undefined });

              // 2. Clear guest session and prep for a fresh game setup
              resetGuestIfNeeded();
              const gameStore = useGameStore.getState();
              gameStore.setSetupComplete(false);
              gameStore.triggerSetup();

              // 3. Reset the mode configuration and open StartModeModal
              const startModal = useStartModalStore.getState();
              startModal.reset();
              startModal.open();

              router.replace({
                pathname: "/",
                params: {
                  fixtureId: undefined,
                  prevMode: undefined,
                },
              });
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
    marginBottom: 10,
  },
});
