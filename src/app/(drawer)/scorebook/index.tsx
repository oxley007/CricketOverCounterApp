"use client";

import { useKeepAwake } from "expo-keep-awake";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../../services/revenuecat";
import { useGameStore } from "../../../state/gameStore";
import { useMatchStore } from "../../../state/matchStore";
import { useTeamStore } from "../../../state/teamStore";

import ActionTabs from "../../../components/ActionTabs";
import AveragePartnership from "../../../components/AveragePartnership";
import BallReminderSettings from "../../../components/BallReminder/BallReminderSettings";
import BallTimerDisplay from "../../../components/BallReminder/BallTimerDisplay";
import { CurrentOverDisplay } from "../../../components/CurrentOverDisplay/CurrentOverDisplay";
import CurrentPartnership from "../../../components/CurrentPartnership";
import CurrentPartnershipDots from "../../../components/CurrentPartnershipDots";
import HighestPartnership from "../../../components/HighestPartnership";
import SubscriptionList from "../../../components/iap/SubscriptionList";
import UpgradeProBox from "../../../components/iap/UpgradeProBox";
import OversCounter from "../../../components/OversCounter";
import ResetButton from "../../../components/ResetButton";
import RotateStrike from "../../../components/RotateStrike";
import MatchRulesSettings from "../../../components/RunModal/MatchRulesSettings";
import ScoreWickets from "../../../components/Score/ScoreWickets";
import BattersPicker from "../../../components/Scorebook/BattersPicker";
import BattingTeamSelector from "../../../components/Scorebook/BattingTeamSelector";
import BowlerPicker from "../../../components/Scorebook/BowlerPicker";
import GameSetupModal from "../../../components/Scorebook/GameSetupModal";
import BaseRunsInput from "../../../components/Settings/BaseRunsInput";
import MatchRulesModal from "../../../components/Settings/MatchRulesModal";
import TotalDots from "../../../components/TotalDots";

import { useBallReminder } from "../../../hooks/useBallReminder";

export default function ScorebookIndex() {
  const {
    isSetupComplete,
    currentGame,
    startGame,
    addBatter,
    addBowler,
    setStrike,
    setCurrentBowler,
    setBowlingTeam,
  } = useGameStore();
  const {
    showMatchRulesModal,
    openMatchRulesModal,
    closeMatchRulesModal,
    proUnlocked,
    setProUnlocked,
    events,
  } = useMatchStore();
  const { teams, loadTeams } = useTeamStore();
  const gameConfig = useGameStore((s) => s.gameConfig);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [battingTeamId, setBattingTeamId] = useState<string | null>(null);
  const [bowlingTeamId, setBowlingTeamId] = useState<string | null>(null);
  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);

  const battingTeam = teams.find((t) => t.id === battingTeamId) ?? null;
  const bowlingTeam = teams.find((t) => t.id === bowlingTeamId) ?? null;

  useKeepAwake();

  // Load teams
  useEffect(() => {
    (async () => {
      try {
        await loadTeams();
      } catch (err) {
        console.warn(err);
      }
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

  // Ball reminder & stats visibility
  const overs = useMemo(
    () => events.filter((e) => e.countsAsBall).length / 6,
    [events],
  );
  const showStats = overs <= 6 || proUnlocked;
  const ballReminderEnabled = overs <= 6 || proUnlocked;
  useBallReminder(ballReminderEnabled);

  const legalBallsBowled = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events],
  );

  // Sync selected batters / bowler with current game
  useEffect(() => {
    if (!currentGame) {
      setSelectedBatters([]);
      setSelectedBowlerId(null);
      return;
    }

    setSelectedBatters((prev) =>
      prev.length > 0 ? prev : currentGame.batters.map((b) => b.playerId),
    );

    if (!selectedBowlerId && currentGame.currentBowlerId)
      setSelectedBowlerId(currentGame.currentBowlerId);
  }, [currentGame]);

  // Sync selected bowler to game store
  useEffect(() => {
    if (selectedBowlerId) {
      setCurrentBowler(selectedBowlerId);
    }
  }, [selectedBowlerId]);

  // Sync selected strike (first batter) to game store
  useEffect(() => {
    if (selectedBatters.length > 0) {
      setStrike(selectedBatters[0]);
    }
  }, [selectedBatters]);

  // Handle reset
  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    setSelectedBatters([]);
    setSelectedBowlerId(null);
  }, []);

  // Handle batting team selection & auto-assign bowling team
  const handleSelectBattingTeam = (teamId: string) => {
    setBattingTeamId(teamId);
    const otherTeam = teams.find((t) => t.id !== teamId);
    setBowlingTeamId(otherTeam?.id ?? null);
  };

  const playingTeams = useMemo(() => {
    if (!gameConfig) return [];

    return teams.filter(
      (t) =>
        t.id === gameConfig.yourTeam.id ||
        t.id === gameConfig.oppositionTeam.id,
    );
  }, [teams, gameConfig]);

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

      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

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

        <BattingTeamSelector
          allTeams={playingTeams}
          selectedBattingTeamId={battingTeamId}
          legalBallsBowled={legalBallsBowled}
          onSelectTeam={(teamId) => {
            const otherTeam = playingTeams.find((t) => t.id !== teamId);
            setBattingTeamId(teamId);
            setBowlingTeamId(otherTeam?.id ?? null);

            if (otherTeam?.id) startGame(teamId, otherTeam.id, []);
          }}
          onReset={handleReset}
        />

        <BattersPicker
          battingTeam={teams.find((t) => t.id === battingTeamId) ?? null}
          selectedBatters={selectedBatters}
          onSelectionChange={setSelectedBatters}
        />

        <BowlerPicker
          bowlingTeam={teams.find((t) => t.id === bowlingTeamId) ?? null}
          selectedBowlerId={selectedBowlerId}
          onSelectionChange={setSelectedBowlerId}
        />

        {!showStats && (
          <UpgradeProBox onUpgrade={() => setShowSubscriptionModal(true)} />
        )}

        {showStats && (
          <>
            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <CurrentPartnership />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <CurrentPartnershipDots />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <AveragePartnership />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <HighestPartnership />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <TotalDots />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <RotateStrike />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {Platform.OS === "android" ? (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#12c2e9" }}>
          <View style={{ paddingBottom: 8 }}>
            <ActionTabs />
          </View>
        </SafeAreaView>
      ) : (
        <ActionTabs />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#12c2e9" },
  container: { padding: 20, paddingBottom: 140 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", alignItems: "stretch" },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginVertical: 10 },
});
