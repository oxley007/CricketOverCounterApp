"use client";

import { useKeepAwake } from "expo-keep-awake";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Button as ButtonRn,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
//import { Button } from 'react-native';
import * as Sentry from "@sentry/react-native";

import {
  configureRevenueCat,
  getCustomerInfo,
  isRevenueCatAvailable,
} from "../../../services/revenuecat";
import { useFixtureStore } from "../../../state/fixtureStore";
import { useGameStore } from "../../../state/gameStore";
import { useMatchStore } from "../../../state/matchStore";
import { useTeamStore } from "../../../state/teamStore";
import { useLiveStore } from "../../../state/liveStore";

import { useIsLiveViewer } from "../../../hooks/useIsLiveViewer";
import { useCurrentUserId } from "../../../hooks/useCurrentUserId";

import { useFeedback } from "../../../hooks/useFeedback";
import { useExitGame } from "../../../hooks/useExitGame";
import { Card } from "react-native-paper";

import {
  startLiveGameEventListener,
  stopLiveGameEventListener,
} from "../../../services/liveGameEventListener";

import { useRouter } from "expo-router";
import { Portal } from "react-native-paper";
import ActionTabs from "../../../components/ActionTabs";
import AveragePartnership from "../../../components/AveragePartnership";
import BallReminderSettings from "../../../components/BallReminder/BallReminderSettings";
import BallTimerDisplay from "../../../components/BallReminder/BallTimerDisplay";
import { CurrentOverDisplay } from "../../../components/CurrentOverDisplay/CurrentOverDisplay";
import CurrentPartnership from "../../../components/CurrentPartnership";
import CurrentPartnershipDots from "../../../components/CurrentPartnershipDots";
import EndInningsButton from "../../../components/EndInningsButton";
import HighestPartnership from "../../../components/HighestPartnership";
import SubscriptionList from "../../../components/iap/SubscriptionList";
import UpgradeProBox from "../../../components/iap/UpgradeProBox";
import OversCounter from "../../../components/OversCounter";
import PlayerStatsModal from "../../../components/PlayerStatsModal";
import PreviousInningsComparison from "../../../components/PreviousInningsComparison";
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
import { getSeasonPlayerStats } from "../../../state/seasonStatsHelpers";
import { useStartModalStore } from "../../../state/startModalStore";
import LiveScoresCard from "../../../components/Live/LiveScoresInfoCard";
import ViewerLockedLiveScoresCard from "../../../components/Live/ViewerLockedLiveScoresCard";
import RemindSupportersCard from "../../../components/Live/RemindSupportersCard";
import CurrentBattingDisplay from "@/src/components/Scorebook/CurrentBattingDisplay";

export default function ScorebookIndex() {
  console.log(
    "🎯 Current Fixture:",
    JSON.stringify(useFixtureStore.getState().currentFixture, null, 2),
  );
  console.log(
    "🏏 Active Batters:",
    JSON.stringify(useGameStore.getState().currentGame?.activeBatters, null, 2),
  );
  console.log(
    "🏏 Current Game check:",
    JSON.stringify(useGameStore.getState().currentGame, null, 2),
  );
  const isSetupComplete = useGameStore((s) => s.isSetupComplete);
  const startGame = useGameStore((s) => s.startGame);
  const setStrike = useGameStore((s) => s.setStrike);
  const setCurrentBowler = useGameStore((s) => s.setCurrentBowler);
  useStartModalStore();
  // State Selectors (Primitives)
  const showMatchRulesModal = useMatchStore((s) => s.showMatchRulesModal);
  const proUnlocked = useMatchStore((s) => s.proUnlocked);
  const proUnlockedScorebook = useMatchStore((s) => s.proUnlockedScorebook);

  // Array Selector (Use useShallow for arrays to avoid re-renders on every ball bowled)
  const events = useMatchStore(useShallow((s) => s.events));

  // Action Selectors (Functions)
  const openMatchRulesModal = useMatchStore((s) => s.openMatchRulesModal);
  const closeMatchRulesModal = useMatchStore((s) => s.closeMatchRulesModal);

  const isSaving = useStartModalStore((state) => state.isSaving);

  const router = useRouter();
  const isLiveViewer = useIsLiveViewer();
  const userId = useCurrentUserId();

  /*
  const localTeams = useTeamStore((s) => s.teams);
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);

  const teams = isLiveViewer ? liveViewTeams : localTeams;
  */

  const loadTeams = useTeamStore((s) => s.loadTeams);
  const gameConfig = useGameStore((s) => s.gameConfig);

  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const currentGame = useGameStore((s) => s.currentGame);
  const currentFixture = useFixtureStore((s) => s.currentFixture);
  //const isSetupComplete = useGameStore((s) => s.isSetupComplete);
  const setupTrigger = useGameStore((s) => s.setupTrigger);
  const selectedMode = useStartModalStore((s) => s.selectedMode);
  //const [isSetupVisible, setIsSetupVisible] = useState(false);

  const livePro = useLiveStore((s) => s.livePro);

  console.log("=== SCOREBOOK RENDER ===");
  console.log({
    isSetupComplete,
    setupTrigger,
    hasHydrated,
  });

  const liveProViewer = useLiveStore((state) => state.liveProViewer);

  // 2. Derive the status on every render
  const isProLiveUnlocked = liveProViewer || livePro;

  //const battingTeamId = currentGame?.battingTeamId ?? null;
  //const bowlingTeamId = currentGame?.bowlingTeamId ?? null;

  const battingTeamId = useGameStore((s) => s.currentGame?.battingTeamId);
  const bowlingTeamId = useGameStore((s) => s.currentGame?.bowlingTeamId);
  //const currentBowlerId = useGameStore((s) => s.currentGame?.currentBowlerId);

  const localTeams = useTeamStore((s) => s.teams);
  const liveViewTeams = useLiveStore((s) => s.liveViewTeams);
  const teams = isLiveViewer ? liveViewTeams : localTeams;

  // 2. Add explicit debugging right before the picker to catch the culprit
  console.log("🔍 [PICKER CHECK]");
  console.log("Current battingTeamId we want:", battingTeamId);
  console.log(
    "Available team IDs in state:",
    teams.map((t) => t.id),
  );

  // 3. Robust find that handles potential string case or whitespace issues
  const resolvedBattingTeam =
    teams.find(
      (t) => t.id?.toString().trim() === battingTeamId?.toString().trim(),
    ) ?? null;

  console.log("🎯 Resolved Batting Team Object:", resolvedBattingTeam);

  console.log("render battingTeamId", battingTeamId);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  console.log("showSubscriptionModal", showSubscriptionModal);
  //const [battingTeamId, setBattingTeamId] = useState<string | null>(null);
  //const [bowlingTeamId, setBowlingTeamId] = useState<string | null>(null);

  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);
  const [isSetupVisible, setIsSetupVisible] = useState(false);
  const statsModalVisible = useGameStore((s) => s.statsModalVisible);
  const statsModalPlayerId = useGameStore((s) => s.statsModalPlayerId);
  const closeStatsModal = useGameStore((s) => s.closeStatsModal);
  //const fixtures = useFixtureStore((s) => s.fixtures);
  const fixtures = useFixtureStore(useShallow((s) => s.fixtures));
  const currentFixtureTeamId = useFixtureStore(
    (s) => s.currentFixture?.yourTeam?.id,
  );

  const { handleExitNoSave } = useExitGame();
  const { triggerTap } = useFeedback();
  useKeepAwake();

  /*
  if (!hasHydrated) {
    return null; // or spinner
  }
    */

  const battingTeam = teams.find((t) => t.id === battingTeamId) ?? null;
  const bowlingTeam = teams.find((t) => t.id === bowlingTeamId) ?? null;

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
      const activeEntitlements = info.entitlements.active || {};

      // Ball Counter subscription
      const isBallActive = activeEntitlements.pro?.isActive ?? false;

      // Scorebook subscription
      const isScorebookActive =
        activeEntitlements.scorebook_pro?.isActive ?? false;

      // Update Zustand store
      const store = useMatchStore.getState();
      store.setProUnlocked(isBallActive);
      store.setProUnlockedScorebook(isScorebookActive);

      // Optional: save to Firestore
      /*
      await saveSubscription({
        ballPro: isBallActive,
        scorebookPro: isScorebookActive,
      });
      */

      console.log(
        "Ball Pro:",
        isBallActive,
        "Scorebook Pro:",
        isScorebookActive,
      );
    })();
  }, []);

  // Open MatchRules on first setup
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const hasSeen = await SecureStore.getItemAsync("hasSeenMatchRules");

      if (!isMounted) return;

      if (!hasSeen && isSetupComplete && !isSetupVisible) {
        openMatchRulesModal();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isSetupComplete, isSetupVisible, openMatchRulesModal]);

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

  // Ball reminder & stats visibility
  // This selector calculates the value before it even hits your component
  const legalBallsBowled = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events],
  );

  const overs = useMemo(() => legalBallsBowled / 6, [legalBallsBowled]);

  const showStats = overs <= 6 || proUnlockedScorebook || isProLiveUnlocked;
  const ballReminderEnabled = overs <= 6 || proUnlocked || proUnlockedScorebook;
  //useBallReminder(ballReminderEnabled);

  /*
  const legalBallsBowled = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events],
  );
  */

  // Sync selected batters / bowler with current game (avoid depending on whole
  // currentGame — new object reference every store update causes effect churn).
  const activeBatterIdsKey = useMemo(
    () =>
      (currentGame?.activeBatters ?? [])
        .map((b) => b.playerId)
        .sort()
        .join(","),
    [currentGame?.activeBatters],
  );

  useEffect(() => {
    console.log(
      JSON.stringify(currentGame),
      " currentGame is what in scorebook index???",
    );

    if (!currentGame) {
      setSelectedBatters([]);
      setSelectedBowlerId(null);
      return;
    }

    const idsFromStore = (currentGame.activeBatters ?? []).map(
      (b) => b.playerId,
    );

    setSelectedBatters((prev) => {
      if (idsFromStore.length === 0) {
        return prev.length === 0 ? prev : [];
      }
      if (prev.length === 0) return idsFromStore;
      return prev;
    });

    setSelectedBowlerId((bowler) => {
      const storeBowler = currentGame.currentBowlerId;
      if (storeBowler != null && storeBowler !== "") {
        return storeBowler === bowler ? bowler : storeBowler;
      }
      return bowler;
    });
  }, [
    currentGame?.battingTeamId,
    currentGame?.bowlingTeamId,
    activeBatterIdsKey,
    currentGame?.currentBowlerId,
  ]);

  /*
  // Sync selected bowler to game store
  useEffect(() => {
    if (!selectedBowlerId) return;
    if (!currentGame?.battingTeamId) return;

    if (currentGame.currentBowlerId === selectedBowlerId) return;

    setCurrentBowler(selectedBowlerId);
  }, [
    selectedBowlerId,
    currentGame?.battingTeamId,
    currentGame?.currentBowlerId, // ✅ add this
    setCurrentBowler,
  ]);*/

  useEffect(() => {
    // 🚨 1. Check if the app is running in read-only Viewer mode
    // (Use whatever hook or store tracks your viewer state, e.g., useLiveStore)
    const isViewer = useLiveStore.getState().isReadOnly;
    if (isViewer) return; // 🛑 Stop completely! Viewers do not force-sync bowler states.

    if (!selectedBowlerId) return;
    if (!currentGame?.battingTeamId) return;
    if (currentGame.currentBowlerId === selectedBowlerId) return;

    setCurrentBowler(selectedBowlerId);
  }, [
    selectedBowlerId,
    currentGame?.battingTeamId,
    currentGame?.currentBowlerId,
    setCurrentBowler,
  ]);

  useEffect(() => {
    if (!currentGame) return;

    const activeIds = (currentGame.activeBatters ?? []).map((b) => b.playerId);

    if (activeIds.length === 0) return;

    const currentStrike = currentGame.currentStrikeId;

    const isValid =
      currentStrike != null &&
      currentStrike !== "" &&
      activeIds.includes(currentStrike);

    if (!isValid) {
      const first = activeIds[0];
      if (first) setStrike(first);
    }
  }, [currentGame?.activeBatters, currentGame?.currentStrikeId]);

  /*
  useEffect(() => {
    if (!isSetupComplete) {
      // Force close first, then reopen after a tiny delay
      setIsSetupVisible(false);
      const timer = setTimeout(() => setIsSetupVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsSetupVisible(false); // hide it when setup is complete
    }
  }, [isSetupComplete]);
  */

  useEffect(() => {
    console.log("SETUP EFFECT FIRED", {
      isSetupComplete,
      setupTrigger,
    });
    // If setup is complete, make sure the modal is hidden
    if (isSetupComplete) {
      console.log("HIDE SETUP MODAL");
      setIsSetupVisible(false);
      return;
    }

    console.log("SHOW SETUP MODAL (with delay)");

    // If setup is NOT complete, flash the modal to ensure it mounts
    setIsSetupVisible(false);
    const timer = setTimeout(() => {
      console.log("SETUP MODAL VISIBLE = TRUE");
      setIsSetupVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [isSetupComplete, setupTrigger]); // setupTrigger still here to catch button taps

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

  const playingTeams = useMemo(() => {
    console.log(JSON.stringify(gameConfig), "what do we ahve in gameConfig?");
    console.log(JSON.stringify(teams), "and what do we have in team here?");

    if (!gameConfig) return [];

    return teams.filter(
      (t) =>
        t.id === gameConfig.yourTeam.id ||
        t.id === gameConfig.oppositionTeam.id,
    );
  }, [teams, gameConfig]);

  const hasPreviousInnings =
    currentFixture?.innings && currentFixture.innings.length > 0;

  const combinePlayerStats = (playerId: string) => {
    if (!playerId || !currentGame) return null;

    /* =========================
         FIND CORRECT TEAM ID
      ========================= */

    const team = teams.find((t) => t.players.some((p) => p.id === playerId));

    const teamId = team?.id ?? "";

    /* =========================
         SEASON STATS (ALL FIXTURES)
      ========================= */

    const seasonStats = getSeasonPlayerStats({
      fixtures,
      teamId,
      season: currentFixture?.season ?? "",
      playerId,
    });

    const matchStore =
      require("../../../state/matchStore").useMatchStore.getState();
    const currentEvents = matchStore.events ?? [];

    /* =========================
     CURRENT GAME BATTING (ALL INNINGS)
========================= */

    const playerEntries =
      currentGame.battingEntries?.filter((e) => e.playerId === playerId) ?? [];

    const battingCurrent = playerEntries.reduce(
      (total, entry) => {
        const entryStats = currentEvents
          .filter((e) => e.batterInningId === entry.entryId && e.countsAsBall)
          .reduce(
            (acc, e) => {
              acc.balls += 1;
              acc.runs += e.runs ?? 0;
              return acc;
            },
            { balls: 0, runs: 0 },
          );

        total.runs += entryStats.runs;
        total.balls += entryStats.balls;

        return total;
      },
      { balls: 0, runs: 0 },
    );

    /* =========================
         CURRENT GAME BOWLING
      ========================= */

    const bowlingCurrent = currentEvents
      .filter((e) => e.bowlerId === playerId)
      .reduce(
        (acc, e) => {
          if (e.countsAsBall) acc.balls += 1;
          if (e.runs != null) acc.runs += e.runs;
          if (e.wicket) acc.wickets += 1;
          if (e.extra === "wide") acc.wides += 1;
          if (e.extra === "noBall") acc.noBalls += 1;
          return acc;
        },
        { balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
      );

    /* =========================
         SEASON OVERS → BALLS
      ========================= */

    const [seasonOversWhole = "0", seasonOversPart = "0"] =
      seasonStats.bowling.overs?.split(".") ?? ["0", "0"];

    const seasonBalls =
      parseInt(seasonOversWhole) * 6 + parseInt(seasonOversPart);

    const totalBallsBowled = seasonBalls + bowlingCurrent.balls;
    const totalRunsConceded = seasonStats.bowling.runs + bowlingCurrent.runs;
    const totalWickets = seasonStats.bowling.wickets + bowlingCurrent.wickets;
    const totalWides = seasonStats.bowling.wides + bowlingCurrent.wides;
    const totalNoBalls = seasonStats.bowling.noBalls + bowlingCurrent.noBalls;

    /* =========================
         COMBINE BATTING
      ========================= */

    const totalRuns = seasonStats.batting.runs + battingCurrent.runs;

    const totalBallsFaced = seasonStats.batting.balls + battingCurrent.balls;

    const totalDismissals = seasonStats.batting.dismissals;

    const average =
      totalDismissals > 0
        ? (totalRuns / totalDismissals).toFixed(2)
        : totalRuns.toFixed(2);

    const strikeRate =
      totalBallsFaced > 0
        ? ((totalRuns / totalBallsFaced) * 100).toFixed(1)
        : "0.0";

    /* =========================
         FORMAT OVERS + ECONOMY
      ========================= */

    const oversFormatted = `${Math.floor(totalBallsBowled / 6)}.${
      totalBallsBowled % 6
    }`;

    const economy =
      totalBallsBowled > 0
        ? ((totalRunsConceded / totalBallsBowled) * 6).toFixed(2)
        : "0.00";

    return {
      batting: {
        ...seasonStats.batting,
        runs: totalRuns,
        balls: totalBallsFaced,
        average,
        strikeRate,
      },
      bowling: {
        ...seasonStats.bowling,
        overs: oversFormatted,
        balls: totalBallsBowled,
        runs: totalRunsConceded,
        wickets: totalWickets,
        economy,
        wides: totalWides,
        noBalls: totalNoBalls,
      },
    };
  };

  const onPress = () => {
    triggerTap();
    handleExitNoSave();
  };

  console.log(JSON.stringify(teams), "doubt team has anything...");
  console.log(battingTeamId, "and waht does battingTeamId have?");
  console.log(selectedBatters, " selectedBatter havea anything ya?");

  return (
    <View style={styles.screen}>
      {isSaving && (
        <Modal visible={isSaving} transparent={false} animationType="fade">
          <View
            style={[
              styles.screen,
              {
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#12c2e9",
              },
            ]}
          >
            <ActivityIndicator size="large" color="#12c2e9" />
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Updating match...
            </Text>
          </View>
        </Modal>
      )}
      {/* 1. Only render the component if setup is NOT complete */}
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

      <SubscriptionList
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tier="coach"
      />

      <ScrollView contentContainerStyle={styles.container}>
        <BallTimerDisplay />
        {!isLiveViewer && (
          <>
            <EndInningsButton
              onComplete={() => {
                setSelectedBatters([]);
                setSelectedBowlerId(null);
              }}
            />
            {!livePro && (
              <LiveScoresCard
                onPress={() => router.push("/live-scoring-info")}
              />
            )}

            {livePro && (
              <RemindSupportersCard
                onPress={() =>
                  router.push({
                    pathname: "/live-scoring-info",
                    params: { modeMessage: "reminder" }, // 🚀 Passing the reminder flag here
                  })
                }
              />
            )}
          </>
        )}

        {isLiveViewer && !isProLiveUnlocked && (
          <ViewerLockedLiveScoresCard
            onPress={() => setShowSubscriptionModal(true)}
          />
        )}

        <CurrentOverDisplay />
        <Card style={styles.card} mode="elevated">
          <View style={styles.scoreRow}>
            <ScoreWickets />
          </View>

          <View style={styles.scoreRow}>
            <OversCounter />
          </View>

          <View style={styles.scoreRow}>
            <CurrentBattingDisplay />
          </View>
        </Card>

        {/*
        <BattingTeamSelector
          allTeams={playingTeams}
          selectedBattingTeamId={battingTeamId}
          legalBallsBowled={legalBallsBowled}
          onSelectTeam={(teamId) => {
            const otherTeam = playingTeams.find((t) => t.id !== teamId);
            if (otherTeam?.id) {
              startGame(teamId, otherTeam.id, []);
            }
          }}
          onReset={handleResetTeams}
        />
        */}
        {!isLiveViewer && (
          <BattingTeamSelector
            allTeams={playingTeams}
            selectedBattingTeamId={currentGame?.battingTeamId ?? null}
            bowlingTeamId={currentGame?.bowlingTeamId ?? null}
            legalBallsBowled={legalBallsBowled}
            onSelectTeam={(battingId, bowlingId) => {
              console.log("START GAME", battingId, bowlingId);
              setSelectedBatters([]);
              setSelectedBowlerId(null);
              startGame(battingId, bowlingId, []);
            }}
            onReset={handleResetTeams}
          />
        )}

        <BattersPicker
          battingTeam={resolvedBattingTeam}
          selectedBatters={selectedBatters}
          onSelectionChange={setSelectedBatters}
        />

        {battingTeamId && bowlingTeamId && (
          <BowlerPicker
            bowlingTeam={bowlingTeam}
            selectedBowlerId={selectedBowlerId}
            onSelectionChange={setSelectedBowlerId}
          />
        )}

        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <Text
            style={styles.fullScorecardLink}
            onPress={() =>
              router.push({
                pathname: "/fixture-scorecard",
                params: {
                  fixtureId: currentFixture?.id,
                  from: "scorebook",
                },
              })
            }
          >
            Full Scorecard
          </Text>
        </View>

        {userId === "jJtMXBshezV40VCd55b9DSbcP5j1" && (
          <ButtonRn
            title="Test Sentry Crash"
            onPress={() =>
              Sentry.captureException(new Error("First Sentry Test Error!"))
            }
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

            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <AveragePartnership />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <HighestPartnership />
              </View>
            </View>

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

      <Portal>
        <PlayerStatsModal
          visible={statsModalVisible}
          onClose={closeStatsModal}
          title={
            statsModalPlayerId
              ? currentGame?.battingTeamId // optional: find player name via team
                ? (currentGame.battingEntries.find(
                    (e) => e.playerId === statsModalPlayerId,
                  )?.playerId ?? "")
                : ""
              : ""
          }
          stats={
            statsModalPlayerId ? combinePlayerStats(statsModalPlayerId) : null
          }
        />
      </Portal>
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
  screen: { flex: 1, backgroundColor: "#12c2e9" },
  container: { padding: 20, paddingBottom: 140 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 0,
    marginBottom: 0,
  },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginVertical: 10 },
  fullScorecardLink: {
    textDecorationLine: "underline",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
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
  card: {
    marginVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#0e9cb9", // Matching dark cyan theme
    padding: 12, // Standard inner padding for card content
    height: "auto", // Prevents unwanted vertical stretching
    alignSelf: "stretch", // Spans the full usable width
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginVertical: 10,
  },
});
