// src/components/PlayerStatsModal.tsx

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, Modal, Portal, Text } from "react-native-paper";
import type {
  SeasonPlayerStats,
  SeasonTeamStats,
} from "../state/seasonStatsHelpers";

type StatsModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  stats: SeasonPlayerStats | SeasonTeamStats | null;
  type?: "player" | "team"; // optional, defaults to "player"
};

export default function PlayerStatsModal({
  visible,
  onClose,
  title,
  stats,
  type = "player",
}: StatsModalProps) {
  if (!stats) return null;

  const isPlayer = type === "player";

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <ScrollView>
          <Text style={styles.title}>{title}</Text>
          <Divider style={styles.divider} />

          {/* ================= BATTING ================= */}
          <Text style={styles.section}>Batting</Text>

          {/* General */}
          <StatRow label="Matches" value={stats.batting.matches} />
          <StatRow label="Innings" value={stats.batting.innings} />
          <StatRow label="Dismissals" value={stats.batting.dismissals} />
          <StatRow label="Runs" value={stats.batting.runs} />
          {/* Highest Score with batter name if team stats */}
          <StatRow
            label="Highest Score"
            value={
              !isPlayer && stats.batting.highestScorerName
                ? `${stats.batting.highestScore} (${stats.batting.highestScorerName})`
                : stats.batting.highestScore
            }
          />

          {/* Remove Average for team stats */}
          {isPlayer && (
            <StatRow label="Average" value={stats.batting.average} />
          )}
          <StatRow label="Strike Rate" value={stats.batting.strikeRate} />
          <StatRow label="Balls Faced" value={stats.batting.balls} />

          <Divider style={styles.dividerSmall} />

          {/* Boundaries & Balls */}
          <StatRow label="Dot Balls" value={stats.batting.dotBalls} />
          <StatRow label="Dot Ball %" value={stats.batting.dotBallPct} />
          <StatRow label="Fours" value={stats.batting.fours} />
          <StatRow label="Fours %" value={stats.batting.foursPct} />
          <StatRow label="Sixes" value={stats.batting.sixes} />
          <StatRow label="Sixes %" value={stats.batting.sixesPct} />
          <StatRow
            label="Boundary Runs %"
            value={stats.batting.boundaryRunsPct}
          />
          <StatRow
            label="Balls per Boundary"
            value={stats.batting.ballsPerBoundary}
          />

          <Divider style={styles.dividerSmall} />

          {/* Milestones */}
          <StatRow label="Not Outs" value={stats.batting.notOuts} />
          <StatRow label="50s" value={stats.batting.fifties} />
          <StatRow label="100s" value={stats.batting.hundreds} />

          <Divider style={styles.divider} />

          {/* ================= BOWLING ================= */}
          <Text style={styles.section}>Bowling</Text>

          {/* General */}
          <StatRow label="Overs" value={stats.bowling.overs} />
          <StatRow label="Balls Bowled" value={stats.bowling.balls} />
          <StatRow label="Maidens" value={stats.bowling.maidens} />
          <StatRow label="Runs" value={stats.bowling.runs} />
          <StatRow label="Wickets" value={stats.bowling.wickets} />
          <StatRow label="Economy" value={stats.bowling.economy} />
          <StatRow label="Wides" value={stats.bowling.wides} />
          <StatRow label="No Balls" value={stats.bowling.noBalls} />

          <Divider style={styles.dividerSmall} />

          {/* Averages & Rates */}
          <StatRow
            label={
              isPlayer
                ? "Average (runs per wicket)"
                : "Average (team runs per wicket)"
            }
            value={stats.bowling.average}
          />
          <StatRow
            label={
              isPlayer
                ? "Strike Rate (balls per wicket)"
                : "Strike Rate (team balls per wicket)"
            }
            value={stats.bowling.strikeRate}
          />
          <StatRow label="Dot Balls" value={stats.bowling.dotBalls} />
          <StatRow label="Dot Ball %" value={stats.bowling.dotBallPct} />

          <Divider style={styles.dividerSmall} />

          {/* Boundaries & Balls */}
          <StatRow label="Fours Conceded" value={stats.bowling.foursConceded} />
          <StatRow label="Sixes Conceded" value={stats.bowling.sixesConceded} />
          <StatRow
            label="Boundary Balls %"
            value={stats.bowling.boundaryBallsPct}
          />
        </ScrollView>

        <Button mode="contained" style={styles.closeButton} onPress={onClose}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

function StatRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  divider: {
    marginVertical: 10,
  },
  dividerSmall: {
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: {
    fontWeight: "500",
    color: "#333",
  },
  value: {
    fontWeight: "500",
    color: "#000",
  },
  closeButton: {
    marginTop: 20,
  },
});
