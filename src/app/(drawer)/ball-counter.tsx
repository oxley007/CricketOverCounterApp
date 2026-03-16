import { useKeepAwake } from "expo-keep-awake";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import ResetButton from "../../components/ResetButton";
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

  // Keep screen awake
  useKeepAwake();

  // Compute completed overs (legal balls only)
  const overs = events.filter((e: MatchEvent) => e.countsAsBall).length / 6;

  //const showStats = overs <= 6 || proUnlocked;
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

      const isProActive =
        customerInfo.entitlements.active["pro"]?.isActive ?? false;

      setProUnlocked(isProActive);
      await saveSubscription(isProActive);
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

  useEffect(() => {
    if (!isSetupComplete) {
      setIsSetupVisible(false);
      const timer = setTimeout(() => setIsSetupVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsSetupVisible(false);
    }
  }, [isSetupComplete]);

  // Handle reset
  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    //setSelectedBatters([]);
    //setSelectedBowlerId(null);
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
        <ResetButton />

        <CurrentOverDisplay />
        <View style={styles.divider} />

        <View style={styles.scoreRow}>
          <ScoreWickets />
        </View>

        <View style={styles.scoreRow}>
          <OversCounter />
        </View>

        <View style={styles.divider} />

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
    gap: 20,
    marginBottom: 16,
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
