// OversCounter.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFixtureStore } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { buildCurrentOverCircles } from "../utils/currentOverUtils";
import { useIsLiveViewer } from "../hooks/useIsLiveViewer";

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

  const isLiveViewer = useIsLiveViewer();

  console.log(
    JSON.stringify(currentFixture),
    " now checking currentFixture from oversCounter",
  );

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
  const netScored = totalRuns - baseRuns;
  const runRate =
    oversBowled > 0
      ? (Math.max(0, netScored) / oversBowled).toFixed(2)
      : "0.00";
  /*const runRate =
    oversBowled > 0 ? (totalRuns / oversBowled).toFixed(2) : "0.00";*/

  /* =========================
   Determine if chasing
========================= */
  let canShowTargetAndRRR = false;

  if (currentFixture && (currentGame?.battingTeamId || !isScorebook)) {
    console.log("hitting this???##");

    const battingTeamId = currentGame?.battingTeamId;

    let battingTeamInnings = 0;
    let oppositionTeamInnings = 0;

    console.log(
      JSON.stringify(currentFixture),
      "checking currentFixture before going on",
    );

    const innings = Array.isArray(currentFixture?.innings)
      ? currentFixture.innings
      : [];

    console.log(JSON.stringify(innings), " check innings");

    //currentFixture.innings.forEach((inn) => {
    innings.forEach((inn) => {
      if (!inn.battingTeamId || inn.matchEvents?.length === 0) return;

      if (inn.battingTeamId === battingTeamId) {
        battingTeamInnings++;
      } else {
        oppositionTeamInnings++;
      }
    });

    console.log("🏏 current batting team:", currentGame?.battingTeamId);
    console.log(
      "🏏 currentFixture batting team:",
      currentFixture?.battingTeamId,
    );

    innings.forEach((inn) => {
      console.log("🏏 innings check", {
        battingTeamId: inn.battingTeamId,
        events: inn.matchEvents?.length,
      });
    });

    // Only show target & RRR if opposition has batted more innings than batting team
    //canShowTargetAndRRR = oppositionTeamInnings > battingTeamInnings;

    if (!isScorebook) {
      console.log(innings.length, " innings.length is?");
      console.log(innings[0]?.totalRuns, " innings[0]?.totalRuns is?");

      canShowTargetAndRRR =
        innings.length >= 2 && (innings[0]?.totalRuns ?? 0) > 0;
    } else {
      canShowTargetAndRRR = oppositionTeamInnings > battingTeamInnings;
    }
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

  console.log(canShowTargetAndRRR, " canShowTargetAndRRR here is?");

  if (canShowTargetAndRRR && currentFixture) {
    console.log("i get in ok here.");

    console.log(
      currentFixture.innings,
      " currentFixture.innings this need checked here.",
    );

    let battingTeamPreviousRuns = 0;
    let oppositionRuns = 0;
    const innings = Array.isArray(currentFixture?.innings)
      ? currentFixture.innings
      : [];

    console.log(
      currentGame?.battingTeamId,
      " currentGame?.battingTeamId checking here now.",
    );

    console.log(
      currentFixture?.battingTeamId,
      " currentFixture?.battingTeamId checking here now.",
    );

    let battingTeamId = "";

    if (isLiveViewer && currentFixture) {
      console.log("shiouldnt hit if live game");
      // If battingTeamId is undefined, fall back to ""
      battingTeamId = currentFixture.battingTeamId ?? "";
    } else {
      console.log("shiould hit if live game");

      // currentGame is also optional, so use safe chaining and fallback
      battingTeamId = currentGame?.battingTeamId ?? "";
    }

    if (battingTeamId) {
      // 🟢 Scorebook Logic

      console.log(
        currentFixture?.battingTeamId,
        " currentFixture?.battingTeamId checking here now.",
      );

      //const battingTeamId = currentFixture.battingTeamId;

      console.log(JSON.stringify(innings), " check innings in here now.");

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

    console.log(oppositionRuns, "oppositionRuns are?");
    console.log(battingTeamPreviousRuns, "battingTeamPreviousRuns are?");

    const runsBehind = oppositionRuns - battingTeamPreviousRuns;
    console.log(runsBehind, " runsBehind needs cehcked here");

    if (runsBehind >= 0) {
      target = runsBehind + 1;
      console.log(target, " what is target in here?");

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
    <View style={styles.statsWrapper}>
      {/* Main Row: Overs and Run Rate */}
      <View style={styles.flexRow}>
        <Text style={styles.headlineText}>
          Overs: <Text style={styles.whiteValueText}>{displayOvers}</Text>
        </Text>

        {/* Visual vertical divider element linking to w-px */}
        <View style={styles.divider} />

        <Text style={styles.headlineText}>
          RR: <Text style={styles.whiteValueText}>{runRate}</Text>
        </Text>
      </View>

      {/* Target & Required Run Rate Chasing Row */}
      {target && (
        <View style={[styles.flexRow, styles.targetMargin]}>
          <Text style={styles.headlineText}>
            Target: <Text style={styles.whiteValueText}>{target}</Text>
          </Text>
          {rrr && (
            <>
              <View style={styles.divider} />
              <Text style={styles.headlineText}>
                RRR: <Text style={styles.whiteValueText}>{rrr}</Text>
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsWrapper: {
    width: "100%",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16, // gap-4 (16px)
  },
  targetMargin: {
    marginTop: 8,
  },
  headlineText: {
    fontFamily: "Plus Jakarta Sans", // headline-md configuration font
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#bcc8cf", // text-on-surface-variant grey color variable
  },
  whiteValueText: {
    color: "#dae2fd", // text-on-surface light color variable
  },
  divider: {
    width: 1, // w-px
    height: 16, // h-4
    backgroundColor: "#3d494e", // bg-outline-variant
  },
});
