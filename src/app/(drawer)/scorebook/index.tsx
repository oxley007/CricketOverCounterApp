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
import { useFixtureStore } from "../../../state/fixtureStore";
import { useGameStore } from "../../../state/gameStore";
import { useMatchStore } from "../../../state/matchStore";
import { useTeamStore } from "../../../state/teamStore";

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

import { useBallReminder } from "../../../hooks/useBallReminder";

export default function ScorebookIndex() {
  const {
    isSetupComplete,
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

  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const currentGame = useGameStore((s) => s.currentGame);
  const currentFixture = useFixtureStore((s) => s.currentFixture);

  const battingTeamId = currentGame?.battingTeamId ?? null;
  const bowlingTeamId = currentGame?.bowlingTeamId ?? null;

  console.log("render battingTeamId", battingTeamId);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  //const [battingTeamId, setBattingTeamId] = useState<string | null>(null);
  //const [bowlingTeamId, setBowlingTeamId] = useState<string | null>(null);

  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);
  const [isSetupVisible, setIsSetupVisible] = useState(!isSetupComplete);
  const { statsModalVisible, statsModalPlayerId, closeStatsModal } =
    useGameStore();
  const fixtures = useFixtureStore((s) => s.fixtures);

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
      prev.length > 0 ? prev : (currentGame.activeBatters ?? []),
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

  // Handle reset
  const handleReset = useCallback(() => {
    useMatchStore.getState().resetInnings();
    useGameStore.getState().resetGame();
    setSelectedBatters([]);
    setSelectedBowlerId(null);
  }, []);

  const playingTeams = useMemo(() => {
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

  return (
    <View style={styles.screen}>
      {/* 1. Only render the component if setup is NOT complete */}
      {isSetupVisible && (
        <GameSetupModal
          visible={isSetupVisible}
          onClose={() => setIsSetupVisible(false)}
        />
      )}

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
          onReset={handleReset}
        />
        */}

        <BattingTeamSelector
          allTeams={playingTeams}
          selectedBattingTeamId={battingTeamId}
          bowlingTeamId={bowlingTeamId}
          legalBallsBowled={legalBallsBowled}
          onSelectTeam={(battingId, bowlingId) => {
            console.log("START GAME", battingId, bowlingId);
            startGame(battingId, bowlingId, []);
          }}
          onReset={handleReset}
        />

        <BattersPicker
          battingTeam={teams.find((t) => t.id === battingTeamId) ?? null}
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
    gap: 0,
    marginBottom: 0,
  },
  statsRow: { flexDirection: "row", alignItems: "stretch" },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginVertical: 10 },
});
