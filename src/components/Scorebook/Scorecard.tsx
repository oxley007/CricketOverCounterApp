import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
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
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

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
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Icon
            name="cricket"
            size={20}
            color="#7fdaff"
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Batting Scorecard</Text>
        </View>
      </View>

      {/* Table Headers */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.columnBatter, styles.headerText]}>Batter</Text>
        <Text style={[styles.columnHowOut, styles.headerText]}>How Out</Text>
        <Text style={[styles.columnBowler, styles.headerText]}>Bowler</Text>
        <Text
          style={[styles.columnStat, styles.headerText, styles.headerTextStat]}
        >
          R
        </Text>
        <Text
          style={[styles.columnStat, styles.headerText, styles.headerTextStat]}
        >
          B
        </Text>
        <Text
          style={[styles.columnStat, styles.headerText, styles.headerTextStat]}
        >
          SR
        </Text>
      </View>

      {/* Table Body Rows inside FlatList */}
      <FlatList
        data={scorecard}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const isActiveBatter = item.onStrike === true;
          const dismissalText = item.statusText ?? getDismissalText(item.entry);
          const isNotOut = dismissalText?.toLowerCase() === "not out";

          return (
            <View
              style={[
                styles.row,
                isActiveBatter ? styles.activeBatterRow : styles.normalRow,
              ]}
            >
              {/* Batter Name */}
              <View style={styles.columnBatter}>
                <View style={styles.nameContainer}>
                  <Text
                    style={[
                      styles.bodyText,
                      isActiveBatter
                        ? styles.activeNameText
                        : styles.outNameText,
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.playerName}
                  </Text>
                </View>
              </View>

              {/* How Out Status */}
              <Text
                style={[
                  styles.bodyText,
                  styles.columnHowOut,
                  isNotOut ? styles.notOutText : styles.dismissedText,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {dismissalText}
              </Text>

              {/* Bowler Name */}
              <Text
                style={[
                  styles.bodyText,
                  styles.columnBowler,
                  isNotOut || !item.bowlerName
                    ? styles.mutedRowText
                    : styles.outNameText,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.bowlerName || "—"}
              </Text>

              {/* Left Aligned Stats Blocks */}
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  isActiveBatter ? styles.activeStatText : styles.outNameText,
                ]}
              >
                {item.runs}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.mutedRowText,
                ]}
              >
                {item.balls}
              </Text>
              <Text
                style={[
                  styles.columnStat,
                  styles.monoStats,
                  styles.statPaddingTop,
                  styles.mutedRowText,
                ]}
              >
                {item.strikeRate}
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
    backgroundColor: "rgba(30, 41, 59, 1)", // glass-card background
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30
    overflow: "hidden",
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
    transform: [{ scaleX: 1 }], // Base layout spacing
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
    paddingVertical: 16, // Reduced slightly from py-5 to accommodate multi-line breathing room safely
    borderBottomWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.1)",
  },
  normalRow: {
    backgroundColor: "transparent",
  },
  activeBatterRow: {
    // 🛠️ Increased opacity slightly and mixed it to match a rich dark-cyan layer
    backgroundColor: "rgba(0, 103, 130, 0.5)", // Richer background color contrast
  },

  // Dynamic Content Sizing Systems
  columnBatter: { flex: 2.2 },
  columnHowOut: { flex: 1.8, paddingRight: 4 },
  columnBowler: { flex: 1.8, paddingRight: 4 },

  // Stats Layout (Now inherently left-aligned by removing textAlign rules)
  columnStat: {
    flex: 0.8,
    paddingLeft: 4,
    alignItems: "flex-start", // 🛠️ Explicitly forces any inner layout elements to the left side
  },

  nameContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Star stays anchored alongside line one
    flexWrap: "wrap", // Safeguards icon clipping rules
    paddingRight: 6,
  },
  starIcon: {
    marginLeft: 2,
    marginTop: 4,
  },

  // Typography Tokens Mapping Configurations
  headerText: {
    fontFamily: "Geist",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#bcc8cf",
    textAlign: "left", // 🛠️ Explicitly forces header texts (R, B, SR) to left-align
  },
  headerTextStat: {
    textAlign: "center", // 🛠️ Explicitly forces header texts (R, B, SR) to left-align
  },
  bodyText: {
    fontSize: 16, // font-body-md
    lineHeight: 24,
  },
  activeNameText: {
    fontWeight: "700", // font-bold
    color: "#7fdaff", // text-primary
  },
  outNameText: {
    fontWeight: "600", // font-semibold
    color: "#dae2fd", // text-on-surface
  },
  notOutText: {
    fontStyle: "italic",
    color: "#bcc8cf", // text-on-surface-variant
  },
  dismissedText: {
    color: "#ffb4ab", // text-error
  },
  monoStats: {
    fontFamily: "Geist",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "left", // 🛠️ Explicitly forces data points to left-align
  },
  activeStatText: {
    fontWeight: "700",
    color: "#7fdaff", // text-primary
  },
  mutedRowText: {
    color: "#bcc8cf", // text-on-surface-variant
  },
  textRight: {
    textAlign: "right",
  },

  // Footer Layout Area Blocks
  extrasContainer: {
    backgroundColor: "#060e20", // bg-surface-container-lowest
    padding: 16, // p-4
    alignItems: "flex-end", // text-right align
  },
  extrasLabel: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#bcc8cf", // text-on-surface-variant
  },
  extrasValue: {
    color: "#dae2fd", // text-on-surface
    marginLeft: 8,
  },
  statPaddingTop: {
    paddingTop: 2, // Fine-tunes alignment for numbers next to multi-line text blocks
  },
});
