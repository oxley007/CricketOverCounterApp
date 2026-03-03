// src/components/PlayerStatsModal.tsx

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, Modal, Portal, Text } from "react-native-paper";
import type { SeasonPlayerStats } from "../state/seasonStatsHelpers";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  stats: SeasonPlayerStats | null;
};

export default function PlayerStatsModal({
  visible,
  onClose,
  title,
  stats,
}: Props) {
  if (!stats) return null;

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

          <StatRow label="Matches" value={stats.batting.matches} />
          <StatRow label="Innings" value={stats.batting.innings} />
          <StatRow label="Dismissals" value={stats.batting.dismissals} />
          <StatRow label="Runs" value={stats.batting.runs} />
          <StatRow label="Highest Score" value={stats.batting.highestScore} />
          <StatRow label="Average" value={stats.batting.average} />
          <StatRow label="Strike Rate" value={stats.batting.strikeRate} />

          <Divider style={styles.divider} />

          {/* ================= BOWLING ================= */}
          <Text style={styles.section}>Bowling</Text>

          <StatRow label="Overs" value={stats.bowling.overs} />
          <StatRow label="Maidens" value={stats.bowling.maidens} />
          <StatRow label="Runs" value={stats.bowling.runs} />
          <StatRow label="Wickets" value={stats.bowling.wickets} />
          <StatRow label="Economy" value={stats.bowling.economy} />
          <StatRow label="Wides" value={stats.bowling.wides} />
          <StatRow label="No Balls" value={stats.bowling.noBalls} />
        </ScrollView>
        <Button mode="contained" style={{ marginTop: 20 }} onPress={onClose}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

function StatRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.row}>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: "100%",
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
});
