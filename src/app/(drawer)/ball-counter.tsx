import { useKeepAwake } from "expo-keep-awake";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useIsLiveViewer } from "../../hooks/useIsLiveViewer";
import { useExitGame } from "../../hooks/useExitGame";

import BattingTeamSelector from "../../components/Scorebook/BattingTeamSelector";
import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../services/revenuecat";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useTeamStore } from "../../state/teamStore";
import { useRouter } from "expo-router";
import { useFeedback } from "../../hooks/useFeedback";

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
import PreviousInningsComparison from "../../components/PreviousInningsComparison";
import RotateStrike from "../../components/RotateStrike";
import MatchRulesSettings from "../../components/RunModal/MatchRulesSettings";
import ScoreWickets from "../../components/Score/ScoreWickets";
import CurrentBattingDisplay from "../../components/Scorebook/CurrentBattingDisplay";
import GameSetupModal from "../../components/Scorebook/GameSetupModal";
import BaseRunsInput from "../../components/Settings/BaseRunsInput";
import MatchRulesModal from "../../components/Settings/MatchRulesModal";
import StartModeModal from "../../components/StartModal/StartModeModal";
import TotalDots from "../../components/TotalDots";
import SubscriptionList from "../../components/iap/SubscriptionList";
import UpgradeProBox from "../../components/iap/UpgradeProBox";
import LiveScoresCard from "../../components/Live/LiveScoresInfoCard";
import { saveSubscription } from "../../services/firestoreService";
import {
  startLiveGameEventListener,
  stopLiveGameEventListener,
} from "../../services/liveGameEventListener";
import { useFixtureStore } from "../../state/fixtureStore";

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: "#12c2e9" }}>
      <HomeContent />
    </View>
  );
}

function HomeContent() {
  //const events = useMatchStore((state) => state.events) as MatchEvent[];
  const router = useRouter();

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
  const events = useMatchStore((s) => s.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);
  const proUnlockedScorebook = useMatchStore((s) => s.proUnlockedScorebook);

  const gameConfig = useGameStore((s) => s.gameConfig);
  const teams = useTeamStore((s) => s.teams);
  const currentGame = useGameStore((s) => s.currentGame);
  const startGame = useGameStore((s) => s.startGame);
  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);

  const battingTeamId = useGameStore((s) => s.currentGame?.battingTeamId);
  const allTeams = useTeamStore((s) => s.teams); // Ensure you're using the correct team list
  const selectedMode = useStartModalStore((s) => s.selectedMode);
  const openStartModal = useStartModalStore((s) => s.open);
  const currentFixtureTeamId = useFixtureStore(
    (s) => s.currentFixture?.yourTeam?.id,
  );

  const currentFixture = useFixtureStore((s) => s.currentFixture);
  console.log(
    JSON.stringify(currentFixture),
    "need to ceh current fixture here.",
  );

  const { handleExitNoSave } = useExitGame();
  const { triggerTap } = useFeedback();

  // Keep screen awake
  useKeepAwake();

  // Compute completed overs (legal balls only)
  //const overs = events.filter((e: MatchEvent) => e.countsAsBall).length / 6;

  //const showStats = overs <= 6 || proUnlocked;
  //const showStats = overs <= 6 || proUnlocked || proScorebookUnlocked;

  // Vibration + flashing reminder
  //useBallReminder(ballReminderEnabled);

  // Show match rules on first launch
  /*
  useEffect(() => {
    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");
      if (!hasSeen) openMatchRulesModal();
    })();
  }, [openMatchRulesModal]);
  */

  useEffect(() => {
    if (events.length > 0) {
      console.log("MATCH_EVENTS_JSON:", JSON.stringify(events, null, 2));
    }
  }, [events]);

  useEffect(() => {
    // 🔑 If no mode is selected, force the selector open
    if (selectedMode === null) {
      openStartModal();

      // Also ensure the setup modal doesn't try to "fight" for the screen
      setIsSetupVisible(false);
    }
  }, [selectedMode, openStartModal]);

  // RevenueCat init
  const hasSavedSubRef = useRef(false);

  useEffect(() => {
    const getCustomerInfoWithRetry = async (retries = 3) => {
      try {
        return await getCustomerInfo();
      } catch (e: any) {
        if (retries > 0 && e?.message?.includes("ingested")) {
          await new Promise((r) => setTimeout(r, 1500));
          return getCustomerInfoWithRetry(retries - 1);
        }
        throw e;
      }
    };

    const init = async () => {
      if (!isRevenueCatAvailable()) return;

      try {
        configureRevenueCat();

        const customerInfo = await getCustomerInfoWithRetry();
        const active = customerInfo.entitlements.active || {};

        const isBallActive = active["pro"]?.isActive ?? false;
        const isScorebookActive = active["scorebook_pro"]?.isActive ?? false;

        setProUnlocked(isBallActive);
        useMatchStore.getState().setProUnlockedScorebook(isScorebookActive);

        // 🔥 prevent loop
        if (!hasSavedSubRef.current) {
          hasSavedSubRef.current = true;

          await saveSubscription({
            ballPro: isBallActive,
            scorebookPro: isScorebookActive,
          });
        }
      } catch (e) {
        console.log("RevenueCat init failed:", e);
      }
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
    if (selectedMode === null) return; // Wait until mode is chosen

    if (isSetupComplete) {
      setIsSetupVisible(false);
      return;
    }

    setIsSetupVisible(false);
    const timer = setTimeout(() => {
      setIsSetupVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isSetupComplete, setupTrigger, selectedMode]);

  // Handle reset
  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    //setSelectedBatters([]);
    //setSelectedBowlerId(null);
  }, []);

  useEffect(() => {
    // Only start listening if we have a fixture and a team ID
    if (currentFixtureTeamId) {
      console.log(
        "🔗 Connecting real-time listener for Team:",
        currentFixtureTeamId,
      );
      startLiveGameEventListener(currentFixtureTeamId);
    }

    return () => {
      // 🛑 Critical: Stop listening when the user leaves this screen
      if (currentFixtureTeamId) {
        console.log("🔌 Disconnecting real-time listener");
        stopLiveGameEventListener(currentFixtureTeamId);
      }
    };
  }, [currentFixtureTeamId]);

  /*
  const legalBallsBowled = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events],
  );*/

  const legalBallsBowled = useMemo(
    () => events.reduce((count, e) => count + (e.countsAsBall ? 1 : 0), 0),
    [events],
  );

  const overs = useMemo(() => legalBallsBowled / 6, [legalBallsBowled]);

  const showStats = overs <= 6 || proUnlocked || proUnlockedScorebook;
  //const ballReminderEnabled = proUnlocked || overs <= 6;
  const ballReminderEnabled = overs <= 6 || proUnlocked || proUnlockedScorebook;

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

  const isLiveViewer = useIsLiveViewer();

  const onPress = () => {
    triggerTap();
    handleExitNoSave();
  };

  if (__DEV__) {
    //console.log("MATCH EVENTS:", events);
    //console.log("Overs:", overs, "Pro unlocked:", proUnlocked);
  }

  return (
    <View style={styles.screen}>
      <StartModeModal />
      {isSetupVisible && selectedMode !== null && (
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
        {!isLiveViewer && (
          <>
            <EndInningsButton onComplete={handleReset} />

            <LiveScoresCard onPress={() => router.push("/live-scoring-info")} />
          </>
        )}

        <CurrentOverDisplay />
        <View style={styles.divider} />

        <View style={styles.scoreRow}>
          <ScoreWickets />
        </View>

        <View style={styles.scoreRow}>
          <OversCounter />
        </View>

        <View style={styles.scoreRow}>
          <CurrentBattingDisplay />
        </View>

        <View style={styles.divider} />
        {!isLiveViewer && (
          <BattingTeamSelector
            allTeams={playingTeams}
            selectedBattingTeamId={currentGame?.battingTeamId ?? null}
            bowlingTeamId={currentGame?.bowlingTeamId ?? null}
            legalBallsBowled={legalBallsBowled}
            onSelectTeam={(battingId, bowlingId) => {
              //console.log("START GAME", battingId, bowlingId);
              startGame(battingId, bowlingId, []);
            }}
            onReset={handleResetTeams}
          />
        )}

        {!showStats && (
          <UpgradeProBox onUpgrade={() => setShowSubscriptionModal(true)} />
        )}

        {showStats && (
          <>
            <View style={styles.statsRow}>
              <PreviousInningsComparison />
            </View>

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
      {!isLiveViewer && (
        <>
          {Platform.OS === "android" ? (
            <SafeAreaView
              edges={["bottom"]}
              style={{ backgroundColor: "#12c2e9" }}
            >
              <View style={{ paddingBottom: 8 }}>
                <ActionTabs />
              </View>
            </SafeAreaView>
          ) : (
            <ActionTabs />
          )}
        </>
      )}
      {isLiveViewer && (
        <>
          {Platform.OS === "android" ? (
            <SafeAreaView
              edges={["bottom"]}
              style={{ backgroundColor: "#12c2e9" }}
            >
              <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Exit Live View</Text>
              </TouchableOpacity>
            </SafeAreaView>
          ) : (
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Exit Live View</Text>
            </TouchableOpacity>
          )}
        </>
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
  liveCard: {
    backgroundColor: "#FFE082", // softer, nicer than harsh yellow
    borderRadius: 14,
    padding: 16,
    marginTop: 12,

    // shadow (makes it feel tappable)
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  liveCardPressed: {
    opacity: 0.85,
  },

  liveCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  liveTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },

  liveSubtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  chevron: {
    fontSize: 22,
    color: "#333",
    marginLeft: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2339c",
    borderWidth: 1,
    borderColor: "#ff4444",
    paddingVertical: 30,
    borderRadius: 12,
    gap: 8,
    // Soft shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "600",
  },
});
