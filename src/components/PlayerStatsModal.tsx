"use client";

import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, Modal, Portal, Text } from "react-native-paper";
import { getCustomerInfo, isRevenueCatAvailable } from "../services/revenuecat";
import { useMatchStore } from "../state/matchStore";
import type {
  SeasonPlayerStats,
  SeasonTeamStats,
} from "../state/seasonStatsHelpers";

type StatsModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  stats: SeasonPlayerStats | SeasonTeamStats | null;
  type?: "player" | "team";
  onUpgrade?: () => void;
};

export default function PlayerStatsModal({
  visible,
  onClose,
  title,
  stats,
  type = "player",
  onUpgrade,
}: StatsModalProps) {
  useEffect(() => {
    (async () => {
      if (!visible) return;
      if (!isRevenueCatAvailable()) return;

      const info = await getCustomerInfo();

      console.log("LOG  Subscription entitlements:", info.entitlements.active);

      // ✅ Check all active entitlements for Ball Counter and Scorebook
      const activeEntitlements = Object.values(info.entitlements.active || {});

      let isBallProActive = false;
      let isScorebookProActive = false;

      activeEntitlements.forEach((entitlement) => {
        const id = entitlement.productIdentifier || "";
        console.log("DEBUG  Checking entitlement:", id);
        if (id.includes("ball")) isBallProActive = true;
        if (id.includes("scorebook")) isScorebookProActive = true;
      });

      console.log("DEBUG  isBallProActive:", isBallProActive);
      console.log("DEBUG  isScorebookProActive:", isScorebookProActive);

      // Update Zustand store
      useMatchStore.getState().setProUnlocked(isBallProActive);
      useMatchStore.getState().setProUnlockedScorebook(isScorebookProActive);
    })();
  }, [visible]);

  const isPlayer = type === "player";
  const proUnlocked = useMatchStore((s) => s.proScorebookUnlocked);
  const showIAPModal = useMatchStore((s) => s.showIAPModal);

  if (!stats) return null;

  // Batting stats
  const battingStats = [
    { label: "Matches", value: stats.batting.matches, free: true },
    { label: "Innings", value: stats.batting.innings, free: true },
    { label: "Dismissals", value: stats.batting.dismissals, free: true },
    { label: "Runs", value: stats.batting.runs, free: true },
    {
      label: "Highest Score",
      value:
        !isPlayer && stats.batting.highestScorerName
          ? `${stats.batting.highestScore} (${stats.batting.highestScorerName})`
          : stats.batting.highestScore,
    },
    ...(isPlayer ? [{ label: "Average", value: stats.batting.average }] : []),
    { label: "Strike Rate", value: stats.batting.strikeRate },
    { label: "Balls Faced", value: stats.batting.balls },
    { label: "Dot Balls", value: stats.batting.dotBalls },
    { label: "Dot Ball %", value: stats.batting.dotBallPct },
    { label: "Fours", value: stats.batting.fours },
    { label: "Fours %", value: stats.batting.foursPct },
    { label: "Sixes", value: stats.batting.sixes },
    { label: "Sixes %", value: stats.batting.sixesPct },
    { label: "Boundary Runs %", value: stats.batting.boundaryRunsPct },
    { label: "Balls per Boundary", value: stats.batting.ballsPerBoundary },
    { label: "Not Outs", value: stats.batting.notOuts },
    { label: "50s", value: stats.batting.fifties },
    { label: "100s", value: stats.batting.hundreds },
  ];

  // Bowling stats
  const bowlingStats = [
    { label: "Overs", value: stats.bowling.overs, free: true },
    { label: "Balls Bowled", value: stats.bowling.balls, free: true },
    { label: "Maidens", value: stats.bowling.maidens, free: true },
    { label: "Runs", value: stats.bowling.runs, free: true },
    { label: "Wickets", value: stats.bowling.wickets },
    { label: "Economy", value: stats.bowling.economy },
    { label: "Wides", value: stats.bowling.wides },
    { label: "No Balls", value: stats.bowling.noBalls },
    {
      label: isPlayer
        ? "Average (runs per wicket)"
        : "Average (team runs per wicket)",
      value: stats.bowling.average,
    },
    {
      label: isPlayer
        ? "Strike Rate (balls per wicket)"
        : "Strike Rate (team balls per wicket)",
      value: stats.bowling.strikeRate,
    },
    { label: "Dot Balls", value: stats.bowling.dotBalls },
    { label: "Dot Ball %", value: stats.bowling.dotBallPct },
    { label: "Fours Conceded", value: stats.bowling.foursConceded },
    { label: "Sixes Conceded", value: stats.bowling.sixesConceded },
    { label: "Boundary Balls %", value: stats.bowling.boundaryBallsPct },
  ];

  const renderStat = (
    stat: { label: string; value: any; free?: boolean },
    idx: number,
  ) => {
    if (stat.free || proUnlocked) {
      return <StatRow key={idx} label={stat.label} value={stat.value} />;
    }
    return (
      <View key={idx} style={styles.row}>
        <Text style={styles.label}>{stat.label}</Text>
        <Text
          style={styles.proText}
          onPress={() => showIAPModal && showIAPModal()}
        >
          Pro
        </Text>
      </View>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <ScrollView>
          {/* ================= CUSTOM PRO BOX ================= */}
          {!proUnlocked && (
            <View style={styles.customProBox}>
              <Text style={styles.customProTitle}>Unlock Pro Stats</Text>
              <Text style={styles.customProDesc}>
                Tap "Upgrade" to view pro options and see advanced stats like
                Average, Strike Rate & Dot Ball % and more!
              </Text>
              <Pressable style={styles.customProButton} onPress={onUpgrade}>
                <Text style={styles.customProButtonText}>Upgrade</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Divider style={styles.divider} />

          <Text style={styles.section}>Batting</Text>
          {battingStats.map(renderStat)}

          <Divider style={styles.divider} />

          <Text style={styles.section}>Bowling</Text>
          {bowlingStats.map(renderStat)}
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
    color: "#000",
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    color: "#000",
  },
  divider: {
    marginVertical: 10,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
    alignItems: "center",
  },
  proText: {
    color: "#4caf50",
    fontWeight: "bold",
  },
  customProBox: {
    backgroundColor: "#e0f7e9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  customProTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    color: "#4caf50",
  },
  customProDesc: { fontSize: 14, color: "#333", marginBottom: 8 },
  customProButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  customProButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
