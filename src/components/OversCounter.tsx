// OversCounter.tsx
import React from "react";
import { StyleSheet, Text } from "react-native";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";

export default function OversCounter() {
  const events = useMatchStore((state) => state.events);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  /* =========================
     Get balls for current over
  ========================= */
  const { ballsThisOver } = buildCurrentOverCircles(events, {
    wideIsExtraBall,
  });

  // Total legal deliveries in match
  const wideExtraBallThreshold = useMatchStore(
    (state) => state.wideExtraBallThreshold,
  );

  const currentFixture = useFixtureStore((s) => s.currentFixture);
  const currentGame = useGameStore((s) => s.currentGame);

  let totalLegalBalls = 0;
  let widesThisOver = 0;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e) continue;

    const isWide = e.extraType === "wide";

    const wideCountsAsLegal =
      wideExtraBallThreshold > 0
        ? widesThisOver >= wideExtraBallThreshold
        : !wideIsExtraBall;

    const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

    if (countsAsLegal) {
      totalLegalBalls++;

      if (totalLegalBalls % 6 === 0) {
        widesThisOver = 0; // reset per over
      }
    }

    if (isWide) {
      widesThisOver++;
    }
  }

  // Completed overs
  const completedOvers = Math.floor(totalLegalBalls / 6);
  const ballsIntoOver = totalLegalBalls % 6;

  const baseOvers =
    ballsIntoOver === 0 && totalLegalBalls > 0
      ? `${completedOvers}.0`
      : `${completedOvers}.${ballsIntoOver}`;

  const totalOvers = currentFixture?.overs ?? 0;

  const displayOvers =
    totalOvers > 0 ? `${baseOvers}/${totalOvers}` : baseOvers; // unlimited matches fallback

  /* =========================
     Runs (includes negative wickets)
  ========================= */
  const totalRuns = events.reduce((sum, e) => {
    let runs = e.runs || 0;

    if (
      wicketsAsNegativeRuns &&
      e.type === "wicket" &&
      runs === 0 &&
      e.kind !== "retired" &&
      e.kind !== "partnership"
    ) {
      runs = -wicketPenaltyRuns;
    }

    return sum + runs;
  }, 0);

  /* =========================
     Run rate
  ========================= */
  const oversBowled = totalLegalBalls / 6;
  const runRate =
    oversBowled > 0 ? (totalRuns / oversBowled).toFixed(2) : "0.00";

  /* =========================
   Determine if chasing
========================= */
  let canShowTargetAndRRR = false;

  if (currentFixture && currentGame?.battingTeamId) {
    const battingTeamId = currentGame.battingTeamId;

    let battingTeamInnings = 0;
    let oppositionTeamInnings = 0;

    currentFixture.innings.forEach((inn) => {
      if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;

      if (inn.battingTeamId === battingTeamId) {
        battingTeamInnings++;
      } else {
        oppositionTeamInnings++;
      }
    });

    // Only show target & RRR if opposition has batted more innings than batting team
    canShowTargetAndRRR = oppositionTeamInnings > battingTeamInnings;
  }

  /* =========================
   Target & RRR (if chasing)
========================= */
  let target: number | null = null;
  let rrr: string | null = null;

  if (canShowTargetAndRRR && currentFixture && currentGame?.battingTeamId) {
    const battingTeamId = currentGame.battingTeamId;
    let battingTeamPreviousRuns = 0;
    let oppositionRuns = 0;

    currentFixture.innings.forEach((inn) => {
      if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;

      if (inn.battingTeamId === battingTeamId) {
        battingTeamPreviousRuns += inn.totalRuns;
      } else {
        oppositionRuns += inn.totalRuns;
      }
    });

    const runsBehind = oppositionRuns - battingTeamPreviousRuns;
    if (runsBehind > 0) {
      // strictly greater than 0
      target = runsBehind + 1;

      const oversBowled = totalLegalBalls / 6;
      const runsRemaining = target - totalRuns;
      const oversRemaining = (currentFixture.overs ?? 0) - oversBowled;

      if (oversRemaining > 0) {
        rrr = (runsRemaining / oversRemaining).toFixed(2);
      }
    }
  }

  return (
    <Text style={styles.text}>
      Overs: {displayOvers}
      {"  "}
      <Text style={styles.subText}>RR: {runRate}</Text>
      {target && (
        <Text style={styles.subText}>
          {"  "}Target: {target}
        </Text>
      )}
      {rrr && (
        <Text style={styles.subText}>
          {"  "}RRR: {rrr}
        </Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5f5f5",
  },
  subText: {
    fontSize: 16,
    opacity: 0.8,
  },
});
