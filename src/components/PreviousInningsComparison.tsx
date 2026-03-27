import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";

export default function PreviousInningsComparison() {
  const events = useMatchStore((s) => s.events);
  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);
  const wideExtraBallThreshold = useMatchStore((s) => s.wideExtraBallThreshold);
  const baseRuns = useMatchStore((s) => s.baseRuns);

  const currentFixture = useFixtureStore((s) => s.currentFixture);
  const currentGame = useGameStore((s) => s.currentGame);

  /* =========================
     Should we show
  ========================= */
  const { canShow, previousInnings } = useMemo(() => {
    if (!currentFixture || !currentGame?.battingTeamId) {
      return { canShow: false, previousInnings: null };
    }

    const battingTeamId = currentGame.battingTeamId;

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
  }, [currentFixture, currentGame]);

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
      totalLegalBalls, // Return this to check if first over is done
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
  }, [previousInnings, wideIsExtraBall, wideExtraBallThreshold]);

  // Logic: Hide if conditions aren't met OR if we are still in the first over
  if (!canShow || !snapshots || totalLegalBalls < 6) return null;

  const current = snapshots[currentOverNumber];
  const next = snapshots[currentOverNumber + 1];

  if (!current && !next) return null;

  /* =========================
     Delta + styling helpers
  ========================= */
  const getDelta = (prevRuns: number) => {
    const diff = currentRuns - prevRuns;
    return {
      text:
        diff === 0 ? "Level" : diff > 0 ? `+${diff} ahead` : `${diff} behind`,
      color: diff > 0 ? "#2e7d32" : diff < 0 ? "#c62828" : "#666",
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textHeader}>Previous Innings Compare:</Text>

      <View style={styles.row}>
        {/* Left Box: Shows the comparison (+/-) */}
        {current && (
          <View style={styles.info}>
            <Text style={styles.textDesc}>
              Over {currentOverNumber - 1}: {current.runs}/{current.wickets}
            </Text>
            <Text
              style={[
                styles.deltaText,
                { color: getDelta(current.runs).color },
              ]}
            >
              {getDelta(current.runs).text}
            </Text>
          </View>
        )}

        {/* Right Box: Only shows the previous innings stats for the next over */}
        {next && (
          <View style={styles.info}>
            <Text style={[styles.textDesc, { marginTop: 6 }]}>
              Over {currentOverNumber}: {next.runs}/{next.wickets}
            </Text>
            {/* getOverDiff removed from here */}
            <Text
              style={[styles.deltaText, { color: getDelta(next.runs).color }]}
            >
              {getDelta(next.runs).text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
    minHeight: 80,
    padding: 10,
    backgroundColor: "#e8e8e8",
    borderRadius: 6,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  textHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  textDesc: {
    fontSize: 16,
    color: "#c471ed",
  },
  deltaText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
});
