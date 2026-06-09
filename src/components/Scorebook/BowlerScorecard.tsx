import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import { calculateBowlerStats } from "../../state/gameHelpers";
import { useGameStore } from "../../state/gameStore";
import type { MatchEvent } from "../../state/matchStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import { useLiveStore } from "../../state/liveStore";
import type { InningsSnapshot } from "../../state/fixtureStore";
import { useIsLiveViewer } from "@/src/hooks/useIsLiveViewer";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  events?: MatchEvent[];
  /** Optional snapshot (e.g. when showing a saved innings); not required for rendering */
  inningsSnapshot?: InningsSnapshot | null;
};

type BowlerScorecardRow = ReturnType<typeof calculateBowlerStats> & {
  playerId: string;
  name: string;
};

export default function BowlerScorecard({ events, inningsSnapshot }: Props) {
  const storeEvents = useMatchStore((s) => s.events);
  const matchEvents: MatchEvent[] = events ?? storeEvents;
  const currentGame = useGameStore((s) => s.currentGame);
  const localTeams = useTeamStore((s) => s.teams);
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

  const isLiveViewer = useIsLiveViewer();

  const teams = isLiveViewer ? liveViewTeams : localTeams;

  if (!currentGame && (!matchEvents || matchEvents.length === 0)) return null;

  // Map player IDs to names
  const playerNameMap = Object.fromEntries(
    teams.flatMap((team) => team.players.map((p) => [p.id, p.name])),
  ) as Record<string, string>;

  // Get unique bowlers from events
  const bowlerIds: string[] = Array.from(
    new Set(
      matchEvents
        .map((e: MatchEvent) => e.bowlerId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const scorecard: BowlerScorecardRow[] = bowlerIds.map((id: string) => ({
    playerId: id,
    name: playerNameMap[id] ?? id,
    ...calculateBowlerStats(matchEvents, id),
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
