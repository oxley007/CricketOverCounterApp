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
   Required Run Rate (RRR)
========================= */
  let rrr: string | null = null;

  if (currentFixture && currentGame?.battingTeamId) {
    const allInnings = currentFixture.innings;
    const battingTeamId = currentGame.battingTeamId;

    // Sum all completed innings totals for opposition
    let oppositionTotal = 0;
    allInnings.forEach((inn) => {
      if (
        inn.battingTeamId && // must exist
        inn.battingTeamId !== battingTeamId && // opposition innings
        inn.matchEvents?.length > 0 // must actually have been played
      ) {
        oppositionTotal += inn.totalRuns;
      }
    });

    if (oppositionTotal > totalRuns) {
      const runsRemaining = oppositionTotal + 1 - totalRuns;
      const totalOvers = currentFixture.overs;
      const oversRemaining = totalOvers - oversBowled;

      if (oversRemaining > 0) {
        rrr = (runsRemaining / oversRemaining).toFixed(2);
      }
    }
  }

  /* =========================
   Show RRR label if chasing
========================= */
  let showRRR = false;

  if (
    currentFixture &&
    currentFixture.innings.length > 0 &&
    currentGame?.battingTeamId
  ) {
    const lastInnings =
      currentFixture.innings[currentFixture.innings.length - 1];

    if (
      lastInnings?.battingTeamId &&
      lastInnings.battingTeamId !== currentGame.battingTeamId
    ) {
      showRRR = true;
    }
  }

  return (
    <Text style={styles.text}>
      Overs: {displayOvers}
      {"  "}
      <Text style={styles.subText}>RR: {runRate}</Text>
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
