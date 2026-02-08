"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ScrollView, View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useKeepAwake } from "expo-keep-awake";

import { useGameStore } from "../../../state/gameStore";
import { useMatchStore } from "../../../state/matchStore";
import { useTeamStore } from "../../../state/teamStore";
import { configureRevenueCat, getCustomerInfo, isRevenueCatAvailable } from "../../../services/revenuecat";

import GameSetupModal from "../../../components/Scorebook/GameSetupModal";
import MatchRulesModal from "../../../components/Settings/MatchRulesModal";
import MatchRulesSettings from "../../../components/RunModal/MatchRulesSettings";
import BallReminderSettings from "../../../components/BallReminder/BallReminderSettings";
import BaseRunsInput from "../../../components/Settings/BaseRunsInput";
import OversCounter from "../../../components/OversCounter";
import ActionTabs from "../../../components/ActionTabs";
import ScoreWickets from "../../../components/Score/ScoreWickets";
import ResetButton from "../../../components/ResetButton";
import CurrentPartnership from "../../../components/CurrentPartnership";
import TotalDots from "../../../components/TotalDots";
import AveragePartnership from "../../../components/AveragePartnership";
import HighestPartnership from "../../../components/HighestPartnership";
import RotateStrike from "../../../components/RotateStrike";
import CurrentPartnershipDots from "../../../components/CurrentPartnershipDots";
import BallTimerDisplay from "../../../components/BallReminder/BallTimerDisplay";
import SubscriptionList from "../../../components/iap/SubscriptionList";
import UpgradeProBox from "../../../components/iap/UpgradeProBox";
import { CurrentOverDisplay } from "../../../components/CurrentOverDisplay/CurrentOverDisplay";
import BattersPicker from "../../../components/Scorebook/BattersPicker";
import BowlerPicker from "../../../components/Scorebook/BowlerPicker";

import { useBallReminder } from "../../../hooks/useBallReminder";

export default function ScorebookIndex() {
  const { isSetupComplete } = useGameStore();
  const { showMatchRulesModal, openMatchRulesModal, closeMatchRulesModal, proUnlocked, setProUnlocked, events } = useMatchStore();
  const { loadTeams, teams } = useTeamStore();
  const currentGame = useGameStore((s) => s.currentGame);
  const startGame = useGameStore((s) => s.startGame);
  const addBatter = useGameStore((s) => s.addBatter);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [battingTeamId, setBattingTeamId] = useState<string | null>(null);
  const [bowlingTeamId, setBowlingTeamId] = useState<string | null>(null);
  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);

  useKeepAwake();

  const overs = useMemo(() => events.filter(e => e.countsAsBall).length / 6, [events]);
  const showStats = overs <= 6 || proUnlocked;
  const ballReminderEnabled = overs <= 6 || proUnlocked;

  useBallReminder(ballReminderEnabled);

  // Load teams
  useEffect(() => {
    (async () => {
      try { await loadTeams(); } catch(err) { console.warn(err); }
    })();
  }, []);

  // RevenueCat init
  useEffect(() => {
    (async () => {
      if (!isRevenueCatAvailable()) return;
      configureRevenueCat();
      const info = await getCustomerInfo();
      setProUnlocked(info.entitlements.active.pro?.isActive ?? false);
    })();
  }, []);

  // Open MatchRules on first setup
  useEffect(() => {
    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");
      if (!hasSeen && isSetupComplete) openMatchRulesModal();
    })();
  }, [isSetupComplete]);

  // Auto select batting/bowling teams if not set
  useEffect(() => {
    if (teams.length === 0) return;

    if (!battingTeamId) setBattingTeamId(teams[0].id);
    if (!bowlingTeamId) {
      if (teams.length > 1) setBowlingTeamId(teams[1].id);
      else setBowlingTeamId(teams[0].id); // single-team edge case
    }
  }, [teams, battingTeamId, bowlingTeamId]);

  const battingTeam = teams.find(t => t.id === battingTeamId) ?? null;
  const bowlingTeam = teams.find(t => t.id === bowlingTeamId) ?? null;

  // Sync selected batters/bowler with currentGame
  useEffect(() => {
    if (!currentGame) {
      setSelectedBatters([]);
      setSelectedBowlerId(null);
      return;
    }

    setSelectedBatters(prev => prev.length > 0 ? prev : currentGame.batters.map(b => b.playerId));
    if (!selectedBowlerId && currentGame.currentBowlerId) setSelectedBowlerId(currentGame.currentBowlerId);
  }, [currentGame]);

  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    setSelectedBatters([]);
    setSelectedBowlerId(null);
  }, []);

  return (
    <View style={styles.screen}>
      <GameSetupModal visible={!isSetupComplete} />

      <MatchRulesModal
        visible={showMatchRulesModal}
        onClose={async () => {
          await SecureStore.setItemAsync("hasSeenMatchRules", "true");
          closeMatchRulesModal();
        }}
      >
        <MatchRulesSettings />
        <BallReminderSettings />
        <BaseRunsInput />
      </MatchRulesModal>

      <SubscriptionList visible={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />

      <ScrollView contentContainerStyle={styles.container}>
        <BallTimerDisplay />
        <ResetButton onReset={handleReset} />
        <CurrentOverDisplay />

        <View style={styles.divider} />

        <View style={styles.scoreRow}>
          <ScoreWickets />
          <OversCounter />
        </View>

        <View style={styles.divider} />

        <BattersPicker
          battingTeam={battingTeam}
          selectedBatters={selectedBatters}
          onSelectionChange={setSelectedBatters}
        />

        <BowlerPicker
          bowlingTeam={bowlingTeam}
          selectedBowlerId={selectedBowlerId}
          onSelectionChange={setSelectedBowlerId}
        />

        {!showStats && <UpgradeProBox onUpgrade={() => setShowSubscriptionModal(true)} />}

        {showStats && (
          <>
            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}><CurrentPartnership /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><CurrentPartnershipDots /></View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}><AveragePartnership /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><HighestPartnership /></View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}><TotalDots /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><RotateStrike /></View>
            </View>
          </>
        )}
      </ScrollView>

      {Platform.OS === "android" ? (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#12c2e9" }}>
          <View style={{ paddingBottom: 8 }}><ActionTabs /></View>
        </SafeAreaView>
      ) : <ActionTabs />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#12c2e9" },
  container: { padding: 20, paddingBottom: 140 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 20, marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "stretch" },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginVertical: 10 },
});