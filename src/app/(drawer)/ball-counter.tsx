import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useKeepAwake } from "expo-keep-awake";

import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import { useStartModalStore } from "../../state/startModalStore";
import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../services/revenuecat";

import OversCounter from "../../components/OversCounter";
import ActionTabs from "../../components/ActionTabs";
import ScoreWickets from "../../components/Score/ScoreWickets";
import ResetButton from "../../components/ResetButton";
import CurrentPartnership from "../../components/CurrentPartnership";
import TotalDots from "../../components/TotalDots";
import AveragePartnership from "../../components/AveragePartnership";
import HighestPartnership from "../../components/HighestPartnership";
import RotateStrike from "../../components/RotateStrike";
import CurrentPartnershipDots from "../../components/CurrentPartnershipDots";
import BallTimerDisplay from "../../components/BallReminder/BallTimerDisplay";
import MatchRulesSettings from "../../components/RunModal/MatchRulesSettings";
import BallReminderSettings from "../../components/BallReminder/BallReminderSettings";
import MatchRulesModal from "../../components/Settings/MatchRulesModal";
import BaseRunsInput from "../../components/Settings/BaseRunsInput";
import SubscriptionList from "../../components/iap/SubscriptionList";
import UpgradeProBox from "../../components/iap/UpgradeProBox";
import { CurrentOverDisplay } from "../../components/CurrentOverDisplay/CurrentOverDisplay";
import StartModeModal from "../../components/StartModal/StartModeModal";

import { useBallReminder } from "../../hooks/useBallReminder";

export default function Home() {
  return (
      <View style={{ flex: 1, backgroundColor: "#12c2e9" }}>
        <HomeContent />
      </View>
    );
}

function HomeContent() {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);
  const openMatchRulesModal = useMatchStore((state) => state.openMatchRulesModal);
  const { showMatchRulesModal, closeMatchRulesModal } = useMatchStore();
  const loadTeams = useTeamStore((state) => state.loadTeams);
  const { selectedMode } = useStartModalStore();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Keep screen awake
  useKeepAwake();

  // Compute completed overs (legal balls only)
  const overs = events.filter((e) => e.countsAsBall).length / 6;

  const showStats = overs <= 6 || proUnlocked;
  const ballReminderEnabled = proUnlocked || overs <= 6;

  // Vibration + flashing reminder
  useBallReminder(ballReminderEnabled);

  // Show match rules on first launch
  useEffect(() => {
    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");
      if (!hasSeen) openMatchRulesModal();
    })();
  }, []);

  // RevenueCat init
  useEffect(() => {
    const init = async () => {
      if (!isRevenueCatAvailable()) return;

      configureRevenueCat();
      const customerInfo = await getCustomerInfo();

      const isProActive =
        customerInfo.entitlements.active["pro"]?.isActive ?? false;

      setProUnlocked(isProActive);
    };

    init();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadTeams();
      } catch (err) {
        console.warn("Failed to load teams:", err);
      }
    })();
  }, []);

  if (__DEV__) {
    console.log("MATCH EVENTS:", events);
    console.log("Overs:", overs, "Pro unlocked:", proUnlocked);
  }

  return (
    <View style={styles.screen}>
      <StartModeModal />
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
        <ResetButton />

        <CurrentOverDisplay />
        <View style={styles.divider} />

        <View style={styles.scoreRow}>
          <ScoreWickets />
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
