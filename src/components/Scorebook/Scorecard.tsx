import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import type { InningsSnapshot } from "../../state/fixtureStore";
import {
  calculateBatterStats,
  getDismissalText,
} from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import type { MatchEvent } from "../../state/matchStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import { useLiveStore } from "../../state/liveStore";
import { useIsLiveViewer } from "@/src/hooks/useIsLiveViewer";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  events?: MatchEvent[];
  /** When showing a saved innings, pass snapshot so we render without currentGame */
  //inningsSnapshot?: Pick<InningsSnapshot, "battingEntries">;
  inningsSnapshot?: Pick<InningsSnapshot, "battingEntries" | "matchEvents">;
};

export default function Scorecard({ events, inningsSnapshot }: Props) {
  const storeEvents = useMatchStore((s) => s.events);
  //const matchEvents = events ?? storeEvents;
  const matchEvents = inningsSnapshot?.matchEvents ?? events ?? storeEvents;
  const currentGame = useGameStore((s) => s.currentGame);
  //const teams = useTeamStore((s) => s.teams);

  const localTeams = useTeamStore((s) => s.teams);
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

  const isLiveViewer = useIsLiveViewer();

  const teams = isLiveViewer ? liveViewTeams : localTeams;

  const battingEntries =
    inningsSnapshot?.battingEntries ?? currentGame?.battingEntries;
  const activeBatters = currentGame?.activeBatters ?? [];
  const activeRetired = currentGame?.activeRetired ?? [];

  if (!battingEntries?.length) return null;

  const playerNameMap = Object.fromEntries(
    teams.flatMap((team) => team.players.map((p) => [p.id, p.name])),
  );

  const scorecard = battingEntries.map((entry) => {
    const stats = calculateBatterStats(
      matchEvents,
      entry.playerId,
      entry.entryId,
    );

    const dismissal = entry.dismissal;

    const isRunOut =
      dismissal?.kind === "runout" || dismissal?.kind === "runOut";

    const isRetired =
      activeRetired.some(
        (b) =>
          b.playerId === entry.playerId && b.batterInningId === entry.entryId,
      ) || dismissal?.kind === "retired";

    const isPartnership = dismissal?.kind?.toLowerCase() === "partnership";

    return {
      key: entry.entryId,
      entry,
      playerId: entry.playerId,
      playerName: playerNameMap[entry.playerId] ?? entry.playerId,
      bowlerName:
        isRetired || isRunOut || isPartnership
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

  console.log(
    JSON.stringify(scorecard),
    "what is scorecard saying on scorecard comp.",
  );

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
              {item.statusText ?? getDismissalText(item.entry)}
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
