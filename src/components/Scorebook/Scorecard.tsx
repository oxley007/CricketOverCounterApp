import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { getDismissalText } from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";

export default function Scorecard() {
  const currentGame = useGameStore((s) => s.currentGame);
  const teams = useTeamStore((s) => s.teams);
  const matchEvents = useMatchStore((s) => s.events);

  if (!currentGame) return null;

  const { batters, currentStrikeId, wickets } = currentGame;

  // Map player IDs to names
  const playerNameMap = Object.fromEntries(
    teams.flatMap((team) => team.players.map((p) => [p.id, p.name])),
  );

  // Compute stats for each batter
  const getBatterStats = (playerId: string) => {
    const eventsForBatter = matchEvents.filter((e) => e.batterId === playerId);
    const runs = eventsForBatter.reduce((sum, e) => sum + (e.runs ?? 0), 0);
    const balls = eventsForBatter.filter((e) => e.countsAsBall).length;
    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
    return { runs, balls, strikeRate };
  };

  // Determine first appearance timestamp for each batter
  const batterFirstEventTime: Record<string, number> = {};

  const allBatterIdsSet = new Set<string>([
    ...batters.map((b) => b.playerId),
    ...(wickets?.map((w) => w.batterId) ?? []),
  ]);

  allBatterIdsSet.forEach((playerId) => {
    const firstEvent = matchEvents.find((e) => e.batterId === playerId);
    const wicketEvent = wickets?.find((w) => w.batterId === playerId);
    const firstTimestamp = firstEvent
      ? firstEvent.timestamp
      : wicketEvent
        ? wicketEvent.timestamp
        : Infinity; // if never faced a ball, place later
    batterFirstEventTime[playerId] = firstTimestamp;
  });

  // Convert set to array and sort by first appearance
  const allBatterIds = Array.from(allBatterIdsSet).sort(
    (a, b) =>
      (batterFirstEventTime[a] ?? Infinity) -
      (batterFirstEventTime[b] ?? Infinity),
  );

  console.log(
    "Active batters:",
    batters.map((b) => b.playerId),
  );
  console.log(
    "Dismissed batters:",
    (wickets ?? []).map((w) => w.batterId),
  );
  console.log("Scorecard batter order by first appearance:", allBatterIds);

  // Build scorecard
  const scorecard = allBatterIds.map((playerId) => {
    const dismissal = wickets?.find((w) => w.batterId === playerId);
    const stats = getBatterStats(playerId);

    return {
      playerId,
      playerName: playerNameMap[playerId] ?? playerId,
      bowlerName: dismissal?.bowlerId
        ? (playerNameMap[dismissal.bowlerId] ?? "Unknown")
        : "-",
      dismissal,
      ...stats,
      onStrike: currentStrikeId === playerId,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.cell}>Name</Text>
        <Text style={styles.cell}>How Out</Text>
        <Text style={styles.cell}>Bowler</Text>
        <Text style={styles.cell}>Runs</Text>
        <Text style={styles.cell}>Balls</Text>
        <Text style={styles.cell}>SR</Text>
      </View>

      <FlatList
        data={scorecard}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item }) => (
          <View style={[styles.row, item.onStrike && styles.onStrikeRow]}>
            <Text style={styles.cell}>{item.playerName}</Text>
            <Text style={styles.cell}>{getDismissalText(item)}</Text>
            <Text style={styles.cell}>{item.bowlerName}</Text>
            <Text style={styles.cell}>{item.runs}</Text>
            <Text style={styles.cell}>{item.balls}</Text>
            <Text style={styles.cell}>{item.strikeRate}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  row: { flexDirection: "row", marginBottom: 6 },
  cell: { flex: 1, fontSize: 14 },
  onStrikeRow: { backgroundColor: "#e0f7ff" },
});
