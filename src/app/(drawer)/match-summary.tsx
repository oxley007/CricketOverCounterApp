// app/match-summary.tsx

import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import InningsTabs from "../../components/InningsTabs";
import { getFixtureById } from "../../services/sqliteService";
import { Fixture, useFixtureStore } from "../../state/fixtureStore";
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
  const currentFixture = useFixtureStore((s) => s.currentFixture);
  const [fixture, setFixture] = useState<Fixture | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (fixtureIdStr) {
        if (currentFixture?.id === fixtureIdStr) {
          if (!cancelled) setFixture(currentFixture);
          return;
        }

        const fromDb = await getFixtureById(fixtureIdStr);
        if (!cancelled) setFixture(fromDb);
        return;
      }

      if (currentFixture?.completed) {
        if (!cancelled) setFixture(currentFixture);
        return;
      }

      if (!cancelled) setFixture(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [fixtureIdStr, currentFixture]);

  // This ensures isResetView is only true if we EXPLICITLY pass
  // something that isn't "scorebook" (like "quick" or "reset")
  const isResetView = prevMode && prevMode !== "scorebook";

  useEffect(() => {
    setSaving(false);
  }, [setSaving]);

  if (fixture === undefined && !isResetView) {
    return (
      <View style={styles.screen}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Match Summary</Text>
        </View>
        <Text style={{ color: "#fff", textAlign: "center" }}>Loading...</Text>
      </View>
    );
  }

  if (!fixture && !isResetView) {
    return (
      <View style={styles.screen}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Match Summary</Text>
        </View>
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Fixture not found.
        </Text>
      </View>
    );
  }

  // -----------------------------
  // Only compute innings/result if fixture exists
  // -----------------------------
  let rawInnings: any[] = [];
  let resultText = "No result";

  if (!isResetView && fixture) {
    rawInnings = Array.isArray(fixture.innings) ? fixture.innings : [];
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
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Ball Counter Reset</Text>
              </View>
              <Text style={{ color: "#fff", marginBottom: 20 }}>
                The match data was cleared successfully.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  useFixtureStore.setState({ currentFixture: undefined });
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
                buttonColor="#6f00be"
                textColor="#fff"
              >
                Continue
              </Button>
            </View>
          ) : (
            <>
              {/* Page Title Wrapper */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Match Summary</Text>
              </View>

              <Button
                mode="contained"
                onPress={() => {
                  useFixtureStore.setState({ currentFixture: undefined });
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
                buttonColor="#6f00be"
                textColor="#fff"
              >
                Continue
              </Button>

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
              <View style={styles.card}>
                {rawInnings
                  .filter((inn) => inn.battingTeamId)
                  .map((inn, idx) => {
                    const teamName =
                      inn.battingTeamId === fixture?.yourTeam?.id
                        ? fixture?.yourTeam?.name
                        : inn.battingTeamId === fixture?.oppositionTeam?.id
                          ? fixture?.oppositionTeam?.name
                          : "UNKNOWN";

                    const scoreText = `${inn.totalRuns}/${inn.totalWickets}`;

                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && <View style={styles.scoreSeparator} />}

                        <View style={styles.teamScoreRow}>
                          <View style={styles.teamInfoCol}>
                            <Text style={styles.teamNameText}>{teamName}</Text>
                          </View>
                          <View style={styles.scoreCol}>
                            <Text style={styles.displayScoreText}>
                              {scoreText}
                            </Text>
                          </View>
                        </View>
                      </React.Fragment>
                    );
                  })}
              </View>

              {/* Tabs */}
              <View style={{ marginBottom: 20 }}>
                <InningsTabs fixture={fixture!} />
              </View>
            </>
          )}

          <Button
            mode="contained"
            onPress={() => {
              useFixtureStore.setState({ currentFixture: undefined });
              resetGuestIfNeeded();
              const gameStore = useGameStore.getState();
              gameStore.setSetupComplete(false);
              gameStore.triggerSetup();

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
            buttonColor="#6f00be"
            textColor="#fff"
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
    backgroundColor: "#0b1326", // updated from blue gradient to match dark brand background color (#0b1326)
  },

  container: {
    padding: 16,
    paddingBottom: 120,
  },

  titleContainer: {
    marginBottom: 16, // mb-gutter
  },

  title: {
    fontSize: 24, // text-headline-lg-mobile
    fontWeight: "700", // font-headline-lg-mobile
    color: "#dae2fd", // text-on-surface
    letterSpacing: -0.4, // tracking-tight
    textAlign: "left",
  },

  continueButton: {
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
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

  card: {
    backgroundColor: "#131b2e", // bg-surface-container-low
    borderWidth: 1,
    borderColor: "#3d494e", // border-outline-variant
    borderRadius: 12, // rounded-xl
    padding: 16, // p-container-padding-mobile (16px)
    marginBottom: 20,
  },

  teamScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  teamInfoCol: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 8,
  },

  scoreCol: {
    flexDirection: "column",
    alignItems: "flex-end",
  },

  teamNameText: {
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
  },

  displayScoreText: {
    fontSize: 32,
    fontWeight: "800", // font-display-score
    color: "#dae2fd", // text-on-surface
    lineHeight: 36,
  },

  scoreSeparator: {
    height: 1, // h-px
    backgroundColor: "#3d494e", // bg-outline-variant
    opacity: 0.3,
    marginVertical: 16,
  },
});
