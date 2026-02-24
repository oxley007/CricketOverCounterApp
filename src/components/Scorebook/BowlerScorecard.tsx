import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import { calculateBowlerStats } from "../../state/gameHelpers";
import { LEGAL_BALLS, useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function BowlerScorecard() {
  const currentGame = useGameStore((s) => s.currentGame);
  const teams = useTeamStore((s) => s.teams);
  const matchEvents = useMatchStore((s) => s.events);

  if (!currentGame) return null;

  // Map player IDs to names
  const playerNameMap = Object.fromEntries(
    teams.flatMap((team) => team.players.map((p) => [p.id, p.name])),
  );

  // Get unique bowlers from events
  const bowlerIds = [
    ...new Set(matchEvents.map((e) => e.bowlerId).filter(Boolean)),
  ];

  const getBowlerStats = (bowlerId: string) => {
    const events = matchEvents.filter((e) => e.bowlerId === bowlerId);

    let legalBalls = 0;
    let runs = 0;
    let wides = 0;
    let noBalls = 0;
    let wickets = 0;

    const overRuns: number[] = [];
    let currentOverRuns = 0;
    let ballsThisOver = 0;

    events.forEach((e) => {
      const penalty = e.wicketPenaltyAdditionBowler ?? 0;
      runs += e.runs ?? 0;

      if (e.extraType === "wide") wides++;
      if (e.extraType === "noBall") noBalls++;

      if (e.countsAsBall) {
        legalBalls++;
        ballsThisOver++;
      }

      // Track wickets
      const wicket = currentGame.wickets.find(
        (w) => w.ballNumber === e.ballNumber && w.bowlerId === bowlerId,
      );
      if (wicket) wickets++;

      currentOverRuns += e.runs ?? 0;

      if (ballsThisOver === LEGAL_BALLS) {
        overRuns.push(currentOverRuns);
        currentOverRuns = 0;
        ballsThisOver = 0;
      }
    });

    // Maidens = overs with 0 runs
    const maidens = overRuns.filter((r) => r === 0).length;

    const overs =
      Math.floor(legalBalls / LEGAL_BALLS) + "." + (legalBalls % LEGAL_BALLS);

    const economy =
      legalBalls > 0 ? ((runs / legalBalls) * LEGAL_BALLS).toFixed(2) : "0.00";

    return {
      overs,
      maidens,
      runs,
      wickets,
      economy,
      wides,
      noBalls,
    };
  };

  const scorecard = bowlerIds.map((id) => ({
    playerId: id,
    name: playerNameMap[id] ?? id,
    ...calculateBowlerStats(matchEvents, id), // ✅ uses the helper including wicketPenaltyAdditionBowler
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.nameCol, styles.headerText]}>Bowler</Text>
        <Text style={[styles.statCol, styles.headerText]}>O</Text>
        <Text style={[styles.statCol, styles.headerText]}>M</Text>
        <Text style={[styles.statCol, styles.headerText]}>R</Text>
        <Text style={[styles.statCol, styles.headerText]}>W</Text>
        <Text style={[styles.econCol, styles.headerText]}>Econ</Text>
        <Text style={[styles.statCol, styles.headerText]}>Wd</Text>
        <Text style={[styles.statCol, styles.headerText]}>Nb</Text>
      </View>

      <FlatList
        data={scorecard}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.nameCol} numberOfLines={2} ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text style={styles.statCol}>{item.overs}</Text>
            <Text style={styles.statCol}>{item.maidens}</Text>
            <Text style={styles.statCol}>{item.runs}</Text>
            <Text style={styles.statCol}>{item.wickets}</Text>
            <Text style={styles.econCol}>{item.economy}</Text>
            <Text style={styles.statCol}>{item.wides}</Text>
            <Text style={styles.statCol}>{item.noBalls}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 6,
  },

  // 👇 Name gets ~45% of screen
  nameCol: {
    width: SCREEN_WIDTH * 0.15,
    fontSize: 14,
    paddingRight: 6,
  },

  // 👇 All stat columns share remaining space evenly
  statCol: {
    flex: 1,
    minWidth: 32,
    fontSize: 14,
    textAlign: "center",
  },

  econCol: {
    flex: 1.2,
    minWidth: 44,
    fontSize: 14,
    textAlign: "center",
  },

  headerText: {
    fontWeight: "700",
  },
});
