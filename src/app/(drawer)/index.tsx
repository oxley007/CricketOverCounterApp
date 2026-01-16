import { ScrollView, Text, View, StyleSheet, Pressable, Modal, Button, Platform } from "react-native";
import OversCounter from "../../components/OversCounter";
import EventList from "../../components/EventList";
import ActionTabs from "../../components/ActionTabs";
import { useMatchStore } from "../../state/matchStore";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useKeepAwake } from 'expo-keep-awake';
import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../services/revenuecat";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrentOverDisplayOld } from "../../components/CurrentOverDisplay_old";
import { CurrentOverDisplay } from "../../components/CurrentOverDisplay/CurrentOverDisplay";
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

import { useBallReminder } from "../../hooks/useBallReminder";

export default function Home() {
  const Wrapper = Platform.OS === "android" ? SafeAreaView : View;

  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);

  const openMatchRulesModal = useMatchStore((state) => state.openMatchRulesModal);
  const { showMatchRulesModal, closeMatchRulesModal } = useMatchStore();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Keep screen awake
  useKeepAwake();

  // Compute completed overs (only legal balls)
  const overs = events.filter((e) => e.countsAsBall).length / 6;

  // ✅ Ball reminder allowed if:
  // - Pro unlocked
  // - OR within free 6 overs
  const ballReminderEnabled = proUnlocked || overs <= 6;

  // ✅ Gate vibration + flashing
  useBallReminder(ballReminderEnabled);

  // Stats visibility
  const showStats = overs <= 6 || proUnlocked;

  useEffect(() => {
    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");
      if (!hasSeen) openMatchRulesModal();
    })();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!isRevenueCatAvailable()) return;

      configureRevenueCat();

      const customerInfo = await getCustomerInfo(); // ✅ fetch once

      const isProActive = customerInfo.entitlements.active["pro"]?.isActive ?? false;

      console.log("Customer Info:", customerInfo);            // full object
      console.log("Pro Active:", isProActive);               // boolean
      console.log("Entitlements Active:", customerInfo.entitlements.active);
      console.log("All Purchased Products:", customerInfo.allPurchasedProductIdentifiers);

      setProUnlocked(isProActive);                           // update your Zustand store
    };

    init();
  }, []);

  if (__DEV__) {
    console.log("MATCH EVENTS:", events);
    console.log("Overs:", overs, "Pro unlocked:", proUnlocked);
  }

  return (
    <Wrapper style={{ flex: 1, backgroundColor: "#12c2e9" }}>
    <View style={styles.screen}>

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
        {/* Conditionally render stats */}
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

      <ActionTabs />
    </View>
    </Wrapper>
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
  statsRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 0 },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginVertical: 10 },
});
