import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper"; // Using Paper typography variants
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";

import { useIsLiveViewer } from "../hooks/useIsLiveViewer";
import { getInningsTeamNames } from "../utils/teamUtils";

export default function PreviousInningsComparison() {
  const events = useMatchStore((s) => s.events);
  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  const wideExtraBallThreshold = useMatchStore((s) => s.wideExtraBallThreshold);
  const baseRuns = useMatchStore((s) => s.baseRuns);

  const currentFixture = useFixtureStore((s) => s.currentFixture);
  const currentGame = useGameStore((s) => s.currentGame);

  const isLiveViewer = useIsLiveViewer();

  /* =========================
     Should we show
  ========================= */
  const { canShow, previousInnings } = useMemo(() => {
    if (!currentGame || !currentGame?.battingTeamId) {
      return { canShow: false, previousInnings: null };
    }

    let battingTeamId = "";

    if (isLiveViewer && currentFixture) {
      battingTeamId = currentFixture.battingTeamId ?? "";
    } else {
      battingTeamId = currentGame?.battingTeamId ?? "";
    }

    let battingTeamInnings = 0;
    let oppositionInnings: any[] = [];

    const innings = Array.isArray(currentFixture.innings)
      ? currentFixture.innings
      : [];

    innings.forEach((inn) => {
      if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;

      if (inn.battingTeamId === battingTeamId) {
        battingTeamInnings++;
      } else {
        oppositionInnings.push(inn);
      }
    });

    return {
      canShow: oppositionInnings.length > battingTeamInnings,
      previousInnings: oppositionInnings[oppositionInnings.length - 1] || null,
    };
  }, [currentFixture, currentGame, isLiveViewer]);

  /* =========================
     Current over + runs
  ========================= */
  const { currentOverNumber, currentRuns, totalLegalBalls } = useMemo(() => {
    let totalLegalBalls = 0;
    let widesThisOver = 0;
    let runs = baseRuns;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e) continue;

      const isWide = e.extraType === "wide";

      const wideCountsAsLegal =
        wideExtraBallThreshold > 0
          ? widesThisOver >= wideExtraBallThreshold
          : !wideIsExtraBall;

      const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

      if (e.type === "ball") runs += e.runs || 0;

      if (countsAsLegal) {
        totalLegalBalls++;
        if (totalLegalBalls % 6 === 0) widesThisOver = 0;
      }

      if (isWide) widesThisOver++;
    }

    return {
      currentOverNumber: Math.floor(totalLegalBalls / 6) + 1,
      currentRuns: runs,
      totalLegalBalls,
    };
  }, [events, wideIsExtraBall, baseRuns, wideExtraBallThreshold]);

  /* =========================
     Previous innings snapshots
  ========================= */
  const snapshots = useMemo(() => {
    if (!previousInnings?.matchEvents) return null;

    let runs = baseRuns;
    let wickets = 0;
    let totalLegalBalls = 0;
    let widesThisOver = 0;

    const map: Record<number, { runs: number; wickets: number }> = {};

    for (let i = 0; i < previousInnings.matchEvents.length; i++) {
      const e = previousInnings.matchEvents[i];
      if (!e) continue;

      const isWide = e.extraType === "wide";

      const wideCountsAsLegal =
        wideExtraBallThreshold > 0
          ? widesThisOver >= wideExtraBallThreshold
          : !wideIsExtraBall;

      const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

      const over = Math.floor(totalLegalBalls / 6) + 1;

      if (!map[over]) {
        map[over] = { runs, wickets };
      }

      if (e.type === "ball") runs += e.runs || 0;
      if (e.type === "wicket" && e.kind !== "retired") wickets++;

      if (countsAsLegal) {
        totalLegalBalls++;
        if (totalLegalBalls % 6 === 0) widesThisOver = 0;
      }

      if (isWide) widesThisOver++;
    }

    const finalOver = Math.floor(totalLegalBalls / 6) + 1;
    if (!map[finalOver]) {
      map[finalOver] = { runs, wickets };
    }

    return map;
  }, [previousInnings, wideIsExtraBall, wideExtraBallThreshold, baseRuns]);

  if (!canShow || !snapshots || totalLegalBalls < 6) return null;

  const current = snapshots[currentOverNumber];
  const next = snapshots[currentOverNumber + 1];

  let activeBattingId = "";

  if (isLiveViewer) {
    activeBattingId = currentFixture?.battingTeamId ?? "";
  } else {
    activeBattingId = currentGame?.battingTeamId ?? "";
  }

  const { battingTeamName, bowlingTeamName } = getInningsTeamNames(
    currentFixture,
    activeBattingId,
  );

  if (!current && !next) return null;

  /* =========================
     Delta + styling helpers
  ========================= */
  const getDelta = (prevRuns: number) => {
    const diff = currentRuns - prevRuns;
    return {
      text:
        diff === 0 ? "Level" : diff > 0 ? `+${diff} ahead` : `${diff} behind`,
      // #66bb6a = Vibrant emerald green (ahead)
      // #ff8a80 = Bright light coral/salmon (behind) - High Contrast!
      // #b2ebf2 = Soft light cyan (level)
      color: diff > 0 ? "#66bb6a" : diff < 0 ? "#ffd54f" : "#b2ebf2",
    };
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.textHeader}>
          Previous Innings Compare
        </Text>

        <View style={styles.row}>
          {/* Left Inner Split Block */}
          {current && (
            <View style={styles.infoBox}>
              <Text style={styles.textDesc}>
                After over {currentOverNumber - 1}, {bowlingTeamName} were:{" "}
                <Text style={styles.boldText}>
                  {current.runs}/{current.wickets}
                </Text>
              </Text>
              <Text
                style={[
                  styles.deltaText,
                  { color: getDelta(current.runs).color },
                ]}
              >
                {battingTeamName} are {getDelta(current.runs).text}
              </Text>
            </View>
          )}

          {/* Right Inner Split Block */}
          {next && (
            <View style={styles.infoBox}>
              <Text style={styles.textDesc}>
                After over {currentOverNumber}, {bowlingTeamName} were:{" "}
                <Text style={styles.boldText}>
                  {next.runs}/{next.wickets}
                </Text>
              </Text>
              <Text
                style={[styles.deltaText, { color: getDelta(next.runs).color }]}
              >
                {getDelta(next.runs).text}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Matches dark cyan dashboard colors
    borderRadius: 12,
    width: "100%",

    // Core layout alignment shadows
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBox: {
    flex: 1,
    minHeight: 85,
    padding: 10,
    // Modern semi-transparent white backdrop layers perfectly over the dark cyan card
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 6,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  textHeader: {
    fontSize: 18,
    lineHeight: 20, // Tight layout tracking rule applied uniformly
    fontWeight: "bold",
    marginBottom: 8,
    color: "#ffffff", // Primary label swapped to pure white
  },
  textDesc: {
    fontSize: 14, // Adjusted slightly to fit inner split columns better
    color: "#e0f7fa", // High-contrast soft cyan text replacing the old purple
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
    color: "#ffffff",
  },
  deltaText: {
    fontSize: 14,
    fontWeight: "800", // Bumped weight up slightly to clear the backdrop texture cleanly
    marginTop: 6,
    textAlign: "center",
  },
});
