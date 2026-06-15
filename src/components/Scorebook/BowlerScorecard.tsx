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
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

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
    <View style={styles.cardContainer}>
      {/* Card Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Icon
            name="circle"
            size={16}
            color="#ddb7ff"
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Bowling Figures</Text>
        </View>
      </View>

      {/* Table Headers Row */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.columnBowler, styles.headerText]}>Bowler</Text>
        <Text style={[styles.columnStat, styles.headerText]}>O</Text>
        <Text style={[styles.columnStat, styles.headerText]}>M</Text>
        <Text style={[styles.columnStat, styles.headerText]}>R</Text>
        <Text style={[styles.columnStat, styles.headerText]}>W</Text>
        <Text style={[styles.columnEcon, styles.headerText]}>Econ</Text>
        <Text style={[styles.columnStat, styles.headerText]}>Wd</Text>
        <Text style={[styles.columnStat, styles.headerText]}>Nb</Text>
      </View>

      {/* Table Body Elements list */}
      <FlatList
        data={scorecard}
        keyExtractor={(item) => item.playerId}
        fadingEdgeLength={0}
        renderItem={({ item }) => {
          // Destructure helper naming variables safely from data model rules
          const overs = item.overs || 0;
          const maidens = item.maidens || 0;
          const runs = item.runsConceded ?? item.runs ?? 0;
          const wickets = item.wickets || 0;
          const econ = item.economyRate?.toFixed(2) ?? item.economy ?? "0.00";
          const wides = item.wides || 0;
          const noBalls = item.noBalls || 0;

          const hasWickets = Number(wickets) > 0;

          return (
            <View style={styles.row}>
              {/* Bowler Full Name String Label */}
              <Text
                style={[
                  styles.bodyText,
                  styles.columnBowler,
                  styles.bowlerNameText,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>

              {/* Exact Metrics Output Block Grid Fields (Left Aligned Only) */}
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.normalStatText,
                ]}
              >
                {overs}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.normalStatText,
                ]}
              >
                {maidens}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.normalStatText,
                ]}
              >
                {runs}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  hasWickets ? styles.activeWicketText : styles.normalStatText,
                ]}
              >
                {wickets}
              </Text>
              <Text
                style={[
                  styles.columnEcon,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.normalStatText,
                ]}
              >
                {econ}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.mutedStatText,
                ]}
              >
                {wides}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.mutedStatText,
                ]}
              >
                {noBalls}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Card Shell Structural Rules
  cardContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.9)", // glass-card background
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30
    overflow: "hidden",
    marginVertical: 6,
  },
  cardHeader: {
    backgroundColor: "#222a3d", // bg-surface-container-high
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    borderBottomWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    transform: [{ scaleX: 1 }],
  },
  headerTitle: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    lineHeight: 28,
    fontWeight: "600",
    color: "#dae2fd", // Base on-surface mapping color
  },

  // Table Flex Layout Adaptations
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16, // py-4
    borderBottomWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.2)", // border-outline-variant/20
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start", // Essential: anchors elements to top line when a name expands downward
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.1)", // divide-outline-variant/10
  },

  // Left-Aligned Table Column Proportions
  columnBowler: {
    flex: 3.0,
    paddingRight: 6,
  },
  columnStat: {
    flex: 0.9,
    paddingLeft: 2,
    alignItems: "flex-start",
  },
  columnEcon: {
    flex: 1.3,
    paddingLeft: 2,
    alignItems: "flex-start",
  },

  // Typography Tokens Mapping Configurations
  headerText: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12, // text-label-caps
    lineHeight: 16,
    letterSpacing: 1.2, // tracking-widest
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#bcc8cf", // text-on-surface-variant
    textAlign: "left",
  },
  bodyText: {
    fontSize: 16, // font-body-md
    lineHeight: 24,
  },
  bowlerNameText: {
    fontWeight: "600", // font-semibold
    color: "#dae2fd", // text-on-surface
  },
  monoStats: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 14, // text-mono-stats
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "left",
  },
  normalStatText: {
    color: "#dae2fd", // text-on-surface
  },
  activeWicketText: {
    fontWeight: "700", // font-bold
    color: "#ddb7ff", // text-secondary (purple variant used for bowlers in your theme)
  },
  mutedStatText: {
    color: "#bcc8cf", // text-on-surface-variant
  },
  statPaddingTop: {
    paddingTop: 2, // Fine-tunes alignment for numbers next to multi-line strings
  },
});
