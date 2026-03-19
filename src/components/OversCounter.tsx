// OversCounter.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";

export default function OversCounter() {
  const events = useMatchStore((state) => state.events);
  const wideIsExtraBall = useMatchStore((state) => state.wideIsExtraBall);
  const wicketsAsNegativeRuns = useMatchStore(
    (state) => state.wicketsAsNegativeRuns,
  );
  const wicketPenaltyRuns = useMatchStore((state) => state.wicketPenaltyRuns);

  const selectedMode = useStartModalStore((s) => s.selectedMode);
  const isScorebook = selectedMode === "scorebook";

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
  const baseRuns = useMatchStore((s) => s.baseRuns);

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
  const totalRuns =
    baseRuns +
    events.reduce((sum, e) => {
      if (e.type === "ball") {
        return sum + (e.runs ?? 0);
      }

      // Handle wicket penalties if needed
      if (
        wicketsAsNegativeRuns &&
        e.type === "wicket" &&
        (e.runs ?? 0) === 0 &&
        e.kind !== "retired" &&
        e.kind !== "partnership"
      ) {
        return sum - wicketPenaltyRuns;
      }

      return sum;
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
    console.log("hitting this???");

    const battingTeamId = currentGame.battingTeamId;

    let battingTeamInnings = 0;
    let oppositionTeamInnings = 0;

    const innings = Array.isArray(currentFixture?.innings)
      ? currentFixture.innings
      : [];

    //currentFixture.innings.forEach((inn) => {
    innings.forEach((inn) => {
      if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;

      if (inn.battingTeamId === battingTeamId) {
        battingTeamInnings++;
      } else {
        oppositionTeamInnings++;
      }
    });

    // Only show target & RRR if opposition has batted more innings than batting team
    canShowTargetAndRRR = oppositionTeamInnings > battingTeamInnings;
  } /*else if (!isScorebook) {
    console.log("or hitting this?");
    console.log("--- INNINGS DEBUG ---");
    console.log("Current Events length:", events.length);
    currentFixture?.innings?.forEach((inn, idx) => {
      console.log(`Innings ${idx}:`, {
        totalRuns: inn.totalRuns,
        eventsInInnings: inn.matchEvents?.length || 0,
        isCurrentEventsMatch: inn.matchEvents === events,
      });
    });

    console.log("--- FIXTURE DEBUG 2 ---");
    console.log("Full Fixture:", JSON.stringify(currentFixture, null, 2));
    console.log("Events array length:", events.length);
    const innings = Array.isArray(currentFixture?.innings)
      ? currentFixture.innings
      : [];

    // Show target & required run rate when the second innings is chasing
    canShowTargetAndRRR = innings.length === 2 && innings[0].totalRuns > 0;
  }*/
  /* =========================
   Target & RRR (if chasing)
========================= */
  let target: number | null = null;
  let rrr: string | null = null;

  if (canShowTargetAndRRR && currentFixture) {
    let battingTeamPreviousRuns = 0;
    let oppositionRuns = 0;
    const innings = Array.isArray(currentFixture?.innings)
      ? currentFixture.innings
      : [];

    if (currentGame?.battingTeamId) {
      // 🟢 Scorebook Logic
      const battingTeamId = currentGame.battingTeamId;
      innings.forEach((inn) => {
        if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;
        if (inn.battingTeamId === battingTeamId) {
          battingTeamPreviousRuns += inn.totalRuns || 0;
        } else {
          oppositionRuns += inn.totalRuns || 0;
        }
      });
    } /*else if (canShowTargetAndRRR && !isScorebook) {
      // 🔵 Ball Counter Logic
      const currentIdx = innings.length - 1;
      for (let i = 0; i < currentIdx; i++) {
        oppositionRuns += innings[i].totalRuns || 0;
      }
    }*/

    const runsBehind = oppositionRuns - battingTeamPreviousRuns;
    if (runsBehind >= 0) {
      target = runsBehind + 1;

      const runsRemaining = target - totalRuns;
      const totalOversMatch = currentFixture.overs ?? 0;
      const totalBallsMatch = totalOversMatch * 6;
      const ballsRemaining = totalBallsMatch - totalLegalBalls;

      if (ballsRemaining > 0 && runsRemaining > 0) {
        rrr = ((runsRemaining / ballsRemaining) * 6).toFixed(2);
      } else if (runsRemaining <= 0) {
        rrr = "0.00";
      }
    }
  }

  return (
    <View>
      <Text style={styles.text}>
        Overs: {displayOvers}
        {"  "}
        <Text style={styles.subText}>RR: {runRate}</Text>
      </Text>
      <Text style={styles.text}>
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
    </View>
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
