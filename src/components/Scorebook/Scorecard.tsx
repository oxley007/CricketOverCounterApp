import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import { getDismissalText } from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Scorecard() {
  const currentGame = useGameStore((s) => s.currentGame);
  const teams = useTeamStore((s) => s.teams);
  const matchEvents = useMatchStore((s) => s.events);

  if (!currentGame) return null;

  const { activeBatters, battingEntries, currentStrikeId, wickets } =
    currentGame;

  /*
  const batters = Array.from(
    new Set([
      ...activeBatters.map((b) => b.playerId), // <-- map to string
      ...battingEntries.map((e) => e.playerId),
    ]),
  );
  */

  const playerNameMap = Object.fromEntries(
    teams.flatMap((team) => team.players.map((p) => [p.id, p.name])),
  );

  const getBatterStats = (batterInningId: string) => {
    const eventsForEntry = matchEvents.filter(
      (e) => e.batterInningId === batterInningId,
    );

    const runs = eventsForEntry.reduce(
      (sum, e) => sum + (e.runBreakdown?.bat ?? 0),
      0,
    );

    const balls = eventsForEntry.filter((e) => e.countsAsBall).length;

    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

    return { runs, balls, strikeRate };
  };

  /*
  const batterFirstEventTime: Record<string, number> = {};

  const allBatterIdsSet = new Set<string>([
    ...batters, // batters is now string[]
    ...(wickets?.map((w) => w.batterId) ?? []),
  ]);

  allBatterIdsSet.forEach((playerId) => {
    const firstEvent = matchEvents.find((e) => e.batterId === playerId);
    const wicketEvent = wickets?.find((w) => w.batterId === playerId);
    const firstTimestamp = firstEvent
      ? firstEvent.timestamp
      : wicketEvent
        ? wicketEvent.timestamp
        : Infinity;

    batterFirstEventTime[playerId] = firstTimestamp;
  });
  

  const allBatterIds = Array.from(allBatterIdsSet).sort(
    (a, b) =>
      (batterFirstEventTime[a] ?? Infinity) -
      (batterFirstEventTime[b] ?? Infinity),
  );
  */

  const scorecard = battingEntries.map((entry) => {
    const stats = getBatterStats(entry.entryId);

    const dismissal = entry.dismissal;

    // Check if batter is retired
    const isRetired = currentGame.activeRetired?.some(
      (b) =>
        b.playerId === entry.playerId && b.batterInningId === entry.entryId,
    );

    return {
      key: entry.entryId,
      playerId: entry.playerId,
      playerName: playerNameMap[entry.playerId] ?? entry.playerId,
      bowlerName: isRetired
        ? "-"
        : dismissal?.bowlerId
          ? (playerNameMap[dismissal.bowlerId] ?? "Unknown")
          : "-",
      dismissal,
      statusText: isRetired ? "Retired" : undefined,
      ...stats,
      onStrike: activeBatters.some(
        (b) =>
          b.playerId === entry.playerId && b.batterInningId === entry.entryId,
      ),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.nameCol, styles.headerText]}>Batter</Text>
        <Text style={[styles.dismissalCol, styles.headerText]}>How Out</Text>
        <Text style={[styles.nameCol, styles.headerText]}>Bowler</Text>
        <Text style={[styles.statCol, styles.headerText]}>R</Text>
        <Text style={[styles.statCol, styles.headerText]}>B</Text>
        <Text style={[styles.srCol, styles.headerText]}>SR</Text>
      </View>

      <FlatList
        data={scorecard}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              item.onStrike && styles.onStrikeRow,
              item.statusText === "Retired" && styles.retiredRow,
            ]}
          >
            <Text style={styles.nameCol} numberOfLines={2} ellipsizeMode="tail">
              {item.playerName}
            </Text>

            <Text
              style={styles.dismissalCol}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.statusText ?? getDismissalText(item)}
            </Text>

            <Text style={styles.nameCol} numberOfLines={2} ellipsizeMode="tail">
              {item.statusText === "Retired" ? "" : item.bowlerName}
            </Text>

            <Text style={styles.statCol}>{item.runs}</Text>
            <Text style={styles.statCol}>{item.balls}</Text>
            <Text style={styles.srCol}>{item.strikeRate}</Text>
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

  // --- Columns ---

  nameCol: {
    width: SCREEN_WIDTH * 0.18,
    fontSize: 14,
    paddingRight: 6,
  },

  dismissalCol: {
    flex: 2,
    fontSize: 14,
    paddingRight: 6,
  },

  bowlerCol: {
    flex: 1.4,
    fontSize: 14,
    paddingRight: 6,
  },

  statCol: {
    flex: 0.8,
    minWidth: 32,
    fontSize: 14,
    textAlign: "center",
  },

  srCol: {
    flex: 1.1,
    minWidth: 44,
    fontSize: 14,
    textAlign: "center",
  },

  headerText: {
    fontWeight: "700",
  },

  onStrikeRow: {
    backgroundColor: "#e0f7ff",
    borderRadius: 4,
  },
  retiredRow: {
    backgroundColor: "#f0f0f0",
    fontStyle: "italic",
  },
});
