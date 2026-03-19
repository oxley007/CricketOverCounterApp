import { useKeepAwake } from "expo-keep-awake";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BattingTeamSelector from "../../components/Scorebook/BattingTeamSelector";
import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../services/revenuecat";
import { useGameStore } from "../../state/gameStore";
import { type MatchEvent, useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useTeamStore } from "../../state/teamStore";

import ActionTabs from "../../components/ActionTabs";
import AveragePartnership from "../../components/AveragePartnership";
import BallReminderSettings from "../../components/BallReminder/BallReminderSettings";
import BallTimerDisplay from "../../components/BallReminder/BallTimerDisplay";
import { CurrentOverDisplay } from "../../components/CurrentOverDisplay/CurrentOverDisplay";
import CurrentPartnership from "../../components/CurrentPartnership";
import CurrentPartnershipDots from "../../components/CurrentPartnershipDots";
import EndInningsButton from "../../components/EndInningsButton";
import HighestPartnership from "../../components/HighestPartnership";
import OversCounter from "../../components/OversCounter";
import RotateStrike from "../../components/RotateStrike";
import MatchRulesSettings from "../../components/RunModal/MatchRulesSettings";
import ScoreWickets from "../../components/Score/ScoreWickets";
import GameSetupModal from "../../components/Scorebook/GameSetupModal";
import BaseRunsInput from "../../components/Settings/BaseRunsInput";
import MatchRulesModal from "../../components/Settings/MatchRulesModal";
import StartModeModal from "../../components/StartModal/StartModeModal";
import TotalDots from "../../components/TotalDots";
import SubscriptionList from "../../components/iap/SubscriptionList";
import UpgradeProBox from "../../components/iap/UpgradeProBox";
import { saveSubscription } from "../../services/firestoreService";

import { useBallReminder } from "../../hooks/useBallReminder";

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: "#12c2e9" }}>
      <HomeContent />
    </View>
  );
}

function HomeContent() {
  const events = useMatchStore((state) => state.events) as MatchEvent[];
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);
  const proScorebookUnlocked = useMatchStore((s) => s.proScorebookUnlocked);
  const openMatchRulesModal = useMatchStore(
    (state) => state.openMatchRulesModal,
  );
  const showMatchRulesModal = useMatchStore((s) => s.showMatchRulesModal);
  const closeMatchRulesModal = useMatchStore((s) => s.closeMatchRulesModal);
  const loadTeams = useTeamStore((state) => state.loadTeams);
  useStartModalStore(); // subscribe so StartModeModal reacts to hydration changes
  const isSetupComplete = useGameStore((s) => s.isSetupComplete);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isSetupVisible, setIsSetupVisible] = useState(!isSetupComplete);
  const setupTrigger = useGameStore((s) => s.setupTrigger);

  const gameConfig = useGameStore((s) => s.gameConfig);
  const { teams } = useTeamStore();
  const currentGame = useGameStore((s) => s.currentGame);
  const { startGame } = useGameStore();
  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);

  // Keep screen awake
  useKeepAwake();

  // Compute completed overs (legal balls only)
  const overs = events.filter((e: MatchEvent) => e.countsAsBall).length / 6;

  //const showStats = overs <= 6 || proUnlocked;
  //const showStats = overs <= 6 || proUnlocked || proScorebookUnlocked;
  const showStats = overs <= 6 || proUnlocked || proScorebookUnlocked;
  //const ballReminderEnabled = proUnlocked || overs <= 6;
  const ballReminderEnabled = overs <= 6 || proUnlocked || proScorebookUnlocked;

  // Vibration + flashing reminder
  useBallReminder(ballReminderEnabled);

  // Show match rules on first launch
  useEffect(() => {
    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");
      if (!hasSeen) openMatchRulesModal();
    })();
  }, [openMatchRulesModal]);

  // RevenueCat init
  useEffect(() => {
    const init = async () => {
      if (!isRevenueCatAvailable()) return;

      configureRevenueCat();
      const customerInfo = await getCustomerInfo();

      const activeEntitlements = customerInfo.entitlements.active || {};

      const isBallActive = activeEntitlements["pro"]?.isActive ?? false; // matches your entitlement
      const isScorebookActive =
        activeEntitlements["scorebook_pro"]?.isActive ?? false; // might be undefined

      setProUnlocked(isBallActive);
      useMatchStore.getState().setProUnlockedScorebook(isScorebookActive); // <- make sure you call the correct setter

      //console.log("ENTITLEMENTS:", customerInfo.entitlements.active);
      //console.log("proUnlocked:", proUnlocked);
      //console.log("proScorebookUnlocked:", proScorebookUnlocked);
      //console.log("showStats:", showStats);

      /*
      const active = customerInfo.entitlements.active || {};

      const isBallActive = active["ball_pro"]?.isActive ?? false;
      const isScorebookActive = active["scorebook_pro"]?.isActive ?? false;

      setProUnlocked(isBallActive);
      useMatchStore.getState().setProUnlockedScorebook(isScorebookActive);
      */
      await saveSubscription({
        ballPro: isBallActive,
        scorebookPro: isScorebookActive,
      });
    };

    init();
  }, [setProUnlocked]);

  useEffect(() => {
    (async () => {
      try {
        await loadTeams();
      } catch (err) {
        console.warn("Failed to load teams:", err);
      }
    })();
  }, [loadTeams]);

  /*
  useEffect(() => {
    if (!isSetupComplete) {
      setIsSetupVisible(false);
      const timer = setTimeout(() => setIsSetupVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsSetupVisible(false);
    }
  }, [isSetupComplete]);

  useEffect(() => {
    setIsSetupVisible(false);
    const timer = setTimeout(() => setIsSetupVisible(true), 50);
    return () => clearTimeout(timer);
  }, [setupTrigger]);
  */

  useEffect(() => {
    // If setup is complete, make sure the modal is hidden
    if (isSetupComplete) {
      setIsSetupVisible(false);
      return;
    }

    // If setup is NOT complete, flash the modal to ensure it mounts
    setIsSetupVisible(false);
    const timer = setTimeout(() => {
      setIsSetupVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isSetupComplete, setupTrigger]); // setupTrigger still here to catch button taps

  // Handle reset
  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    //setSelectedBatters([]);
    //setSelectedBowlerId(null);
  }, []);

  const legalBallsBowled = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events],
  );

  const playingTeams = useMemo(() => {
    if (!gameConfig) return [];

    return teams.filter(
      (t) =>
        t.id === gameConfig.yourTeam.id ||
        t.id === gameConfig.oppositionTeam.id,
    );
  }, [teams, gameConfig]);

  const handleResetTeams = useCallback(() => {
    // 1. Clear the nested game data (this makes BattingTeamSelector show the list)
    useGameStore.getState().resetTeamsOnly();

    // 2. Clear your local component state
    setSelectedBatters([]);
    setSelectedBowlerId(null);

    // 3. Clear matchStore events if necessary
    useMatchStore.getState().resetInnings();

    // Note: Because we didn't call resetGame(), isSetupComplete stays TRUE.
  }, []);

  if (__DEV__) {
    console.log("MATCH EVENTS:", events);
    console.log("Overs:", overs, "Pro unlocked:", proUnlocked);
  }

  return (
    <View style={styles.screen}>
      <StartModeModal />
      {isSetupVisible && (
        <GameSetupModal
          visible={isSetupVisible}
          onClose={() => setIsSetupVisible(false)}
        />
      )}
      {/* Match rules modal */}
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

      {/* Subscription modal */}
      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <BallTimerDisplay />
        <EndInningsButton onComplete={handleReset} />

        <CurrentOverDisplay />
        <View style={styles.divider} />

        <View style={styles.scoreRow}>
          <ScoreWickets />
        </View>

        <View style={styles.scoreRow}>
          <OversCounter />
        </View>

        <View style={styles.divider} />

        <BattingTeamSelector
          allTeams={playingTeams}
          selectedBattingTeamId={currentGame?.battingTeamId ?? null}
          bowlingTeamId={currentGame?.bowlingTeamId ?? null}
          legalBallsBowled={legalBallsBowled}
          onSelectTeam={(battingId, bowlingId) => {
            console.log("START GAME", battingId, bowlingId);
            startGame(battingId, bowlingId, []);
          }}
          onReset={handleResetTeams}
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
  screen: {
    flex: 1,
    backgroundColor: "#12c2e9",
  },
  container: {
    padding: 20,
    paddingBottom: 140,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 0,
    marginBottom: 0,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  divider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginVertical: 10,
  },
});
