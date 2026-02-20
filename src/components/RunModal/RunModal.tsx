import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore, WicketEvent } from "../../state/gameStore";
import { useMatchStore, type MatchEvent } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import { buildCurrentOverCircles } from "../../utils/currentOverUtils";
import BallReminderSettings from "../BallReminder/BallReminderSettings";
import DismissBatterModal from "../Scorebook/DismissBatterModal";
import SelectPlayersModal from "../Scorebook/SelectPlayersModal";
import BaseRunsInput from "../Settings/BaseRunsInput";
import CustomRunsInput from "./CustomRunsInput";
import MatchRulesSettings from "./MatchRulesSettings";

interface RunModalProps {
  visible: boolean;
  onClose: () => void;
  retireOnlyMode?: boolean;
}

export default function RunModal({
  visible,
  onClose,
  retireOnlyMode = false,
}: RunModalProps) {
  const Wrapper = Platform.OS === "android" ? SafeAreaView : View;

  const {
    addEvent,
    wideIsExtraBall,
    wicketsAsNegativeRuns,
    wicketPenaltyRuns,
  } = useMatchStore();
  //const { currentGame, updateBatterStats } = useGameStore();
  //const [selectedRuns, setSelectedRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<number | null>(null);
  const [batRuns, setBatRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | null>(
    null,
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedWickets, setSelectedWickets] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState<
    "batter" | "bowler" | null
  >(null);

  const currentGame = useGameStore((s) => s.currentGame);
  const updateBatterStats = useGameStore((s) => s.updateBatterStats);
  const setStrike = useGameStore((s) => s.setStrike);
  const setCurrentBowler = useGameStore((s) => s.setCurrentBowler);
  const applyStrikeChange = useGameStore((s) => s.applyStrikeChange);
  const updateBowlerStats = useGameStore((s) => s.updateBowlerStats);
  const addBatter = useGameStore((s) => s.addBatter);
  const teams = useTeamStore((s) => s.teams);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissedBatterId, setDismissedBatterId] = useState<string | null>(
    null,
  );
  const [dismissedKind, setDismissedKind] = useState<
    WicketEvent["kind"] | null
  >(null);
  const addWicket = useGameStore((s) => s.addWicket);
  const [selectedBatters, setSelectedBatters] = useState<string[]>([]);
  const [confirmingWicket, setConfirmingWicket] = useState(false);

  // Automatically submit when a batter is selected from DismissBatterModal
  useEffect(() => {
    if (dismissedBatterId) {
      handleSubmit();
    }
  }, [dismissedBatterId]);

  // LOGGING AFTER HOOKS
  console.log("==== HANDLE SUBMIT LOGS ====");
  console.log("Current Strike ID:", currentGame?.currentStrikeId);
  console.log("Current active batters:", currentGame?.activeBatters);
  console.log("Current batting entries:", currentGame?.battingEntries);
  console.log(
    "Selected runs:",
    selectedRuns,
    "Bat runs (state):",
    batRuns,
    "Extras (state):",
    selectedExtras,
  );

  const inScorebookMode = !!currentGame;
  const battingTeam = useMemo(
    () =>
      currentGame?.battingTeamId
        ? teams.find((t) => t.id === currentGame.battingTeamId)
        : null,
    [currentGame?.battingTeamId, teams],
  );
  const bowlingTeam = useMemo(
    () =>
      currentGame?.bowlingTeamId
        ? teams.find((t) => t.id === currentGame.bowlingTeamId)
        : null,
    [currentGame?.bowlingTeamId, teams],
  );

  const batterPlayers = useMemo(() => {
    if (!currentGame || !battingTeam) return [];
    return (currentGame.activeBatters ?? []).map((b) => {
      // b could be string OR object
      const playerId = typeof b === "string" ? b : b.playerId;
      const p = battingTeam.players.find((pl) => pl.id === playerId);
      return { id: playerId, name: p?.name ?? playerId };
    });
  }, [currentGame?.activeBatters, battingTeam]);

  const currentBatterName = useMemo(() => {
    if (!currentGame?.currentStrikeId || !battingTeam) return null;
    const p = battingTeam.players.find(
      (pl) => pl.id === currentGame.currentStrikeId,
    );
    return p?.name ?? null;
  }, [currentGame?.currentStrikeId, battingTeam]);

  const currentBowlerName = useMemo(() => {
    if (!currentGame?.currentBowlerId || !bowlingTeam) return null;
    const p = bowlingTeam.players.find(
      (pl) => pl.id === currentGame.currentBowlerId,
    );
    return p?.name ?? null;
  }, [currentGame?.currentBowlerId, bowlingTeam]);

  const runOptions = [1, 2, 3, 4, 5, 6];
  const extraOptions = ["Wide", "No Ball", "Bye", "Leg Bye", "Penalty"];
  const wicketOptions = [
    "Bowled",
    "Caught",
    "LBW",
    "Stumped",
    "Run Out",
    "Hit Wicket",
    "Retired",
  ];

  const resetSelections = () => {
    setSelectedRuns(null);
    setSelectedExtras([]);
    setSelectedWickets([]);
  };

  const toggleExtra = (extra: string) => {
    setSelectedExtras(
      (prev) => (prev.includes(extra) ? [] : [extra]), // single selection
    );
  };

  /*
  const toggleWicket = (wicket: string) => {
    setSelectedWickets(
      (prev) => (prev.includes(wicket) ? [] : [wicket]), // single selection
    );
  };
  */

  const normalizeExtraType = (extra?: string) => {
    switch (extra) {
      case "Wide":
        return "wide";
      case "No Ball":
        return "noBall";
      case "Bye":
        return "bye";
      case "Leg Bye":
        return "legBye";
      case "Penalty":
        return "penalty";
      default:
        return undefined;
    }
  };

  const normalizeWicketKind = (w?: string) =>
    w?.toLowerCase().replace(" ", "") as any;

  const handleSubmit = () => {
    // 🔹 Log the batter who should get the runs
    const strikeBatterId = currentGame?.currentStrikeId;
    const strikeBatterName = battingTeam?.players.find(
      (p) => p.id === strikeBatterId,
    )?.name;
    console.log(
      "⚡ Handling runs for batter:",
      strikeBatterName,
      strikeBatterId,
    );

    const activeBatter = currentGame?.activeBatters.find(
      (b) => b.playerId === strikeBatterId,
    );

    const batterInningId = activeBatter?.batterInningId;

    const isExtra = selectedExtras.length > 0;
    const hasWicket = selectedWickets.length > 0;
    const isScoringWicket = wicketsAsNegativeRuns && hasWicket;

    console.log(hasWicket, "hasWicket");
    console.log(confirmingWicket, "confirmingWicket");

    if (hasWicket && !confirmingWicket) {
      setConfirmingWicket(true);
      return;
    }

    // ✅ ADD RETIRED BATTER LOGIC HERE
    if (selectedWickets.includes("Retired")) {
      if (!dismissedBatterId) return; // safety check

      let bat = selectedRuns ?? 0;
      let extras = 0;
      if (selectedExtras.includes("No Ball")) extras += 1;
      if (selectedExtras.includes("Wide")) extras += selectedRuns ?? 1;

      const batterId = dismissedBatterId;
      const bowlerId = currentGame.currentBowlerId ?? null;

      addEvent({
        type: "wicket",
        batterId,
        batterInningId,
        bowlerId,
        kind: "retired",
        runs: bat + extras,
        isExtra: extras > 0,
        countsAsBall: false,
        runBreakdown: { bat, extras },
        wicket: null,
        prevBatterId: currentGame?.currentStrikeId,
      });

      //useGameStore.getState().retireBatter(batterId);
      handleDismissBatter(batterId, { retired: true });

      resetSelections();
      setDismissedBatterId(null);
      setDismissedKind(null);
      setConfirmingWicket(false);

      // 🚫 Remove this onClose() here
      // onClose();

      return;
    }

    // 🚫 Block invalid scoring wicket combos
    if (isScoringWicket) {
      const hasBlockingExtras = selectedExtras.some(
        (e) => e !== "Wide" && e !== "No Ball",
      );

      const hasBlockingRuns = selectedRuns !== null && selectedRuns > 0;

      if (hasBlockingRuns && hasBlockingExtras) {
        // TODO: show toast
        return;
      }
    }

    // 🔢 Basic flags
    const totalRuns = selectedRuns ?? 0;
    const isNoBall = selectedExtras.includes("No Ball");
    const isWide = selectedExtras.includes("Wide");

    // 🧮 Run breakdown
    let bat = 0;
    let extras = 0;

    if (isNoBall) {
      extras = 1;
      if (totalRuns > 1) {
        bat = batRuns ?? totalRuns - 1;
      }
    } else if (isWide) {
      bat = 0;
      extras = totalRuns || 1;
    } else {
      bat = totalRuns;
      extras = 0;
    }

    const runs = bat + extras;

    // 🎯 Ball counting rule
    let countsAsBall = isWide ? !wideIsExtraBall : true;

    // Override for no-ball
    if (isNoBall) countsAsBall = false;

    console.log("Counts as ball:", countsAsBall);
    console.log(
      "isWide:",
      isWide,
      "isNoBall:",
      isNoBall,
      "wideIsExtraBall:",
      wideIsExtraBall,
    );

    // 🧠 Helpers (now safe — bat/extras/countsAsBall exist)
    /*
    const maybeUpdateBatter = (batterId: string) => {
      if (!inScorebookMode) return;
      if (bat === 0 && !countsAsBall) return;

      updateBatterStats(batterId, bat, countsAsBall ? 1 : 0);

      // Update bowler stats for this ball
      if (currentGame?.currentBowlerId) {
        const bowlerRuns = bat + extras;
        updateBowlerStats(
          currentGame.currentBowlerId,
          bowlerRuns,
          countsAsBall ? 1 : 0,
          0,
          normalizeExtraType(selectedExtras[0]) as
            | "wide"
            | "noBall"
            | undefined,
        );
      }
    };
    */

    const maybeUpdateBatter = (batterId: string) => {
      if (!inScorebookMode) return;
      if (bat === 0 && !countsAsBall) return;

      updateBatterStats(batterId, bat, countsAsBall ? 1 : 0);

      // Update bowler stats for this ball using over index
      if (currentGame?.currentBowlerId) {
        const bowlerRuns = bat + extras;

        // Get actual balls this over
        const { ballsThisOver: actualBallsThisOver } = buildCurrentOverCircles(
          useMatchStore.getState().events,
          { wideIsExtraBall: useMatchStore.getState().wideIsExtraBall },
        );

        const overBallIndex = actualBallsThisOver % 6;

        updateBowlerStats(
          currentGame.currentBowlerId,
          bowlerRuns,
          countsAsBall ? 1 : 0,
          overBallIndex,
          normalizeExtraType(selectedExtras[0]) as
            | "wide"
            | "noBall"
            | undefined,
        );
      }
    };

    const applyStrikeFromLastEvent = () => {
      const lastEvent = useMatchStore.getState().events.at(-1);
      if (!lastEvent) return;

      maybeUpdateBatter(strikeBatterId!);

      applyStrikeChange({
        bat: lastEvent.runBreakdown.bat,
        extras: lastEvent.runBreakdown.extras,
        countsAsBall: lastEvent.countsAsBall,
        extraType: lastEvent.extraType,
        runs: lastEvent.runs,
      });
    };

    // 🏏 Wicket types
    const isRetired = selectedWickets.includes("Retired");
    const isPartnership = selectedWickets.includes("Partnership");

    // 🟥 Wicket as negative runs
    if (hasWicket && wicketsAsNegativeRuns && !isRetired && !isPartnership) {
      let extrasRuns = 0;

      if (isWide || isNoBall) {
        extrasRuns = 1;
      }

      const penalty = wicketPenaltyRuns || 0;

      addEvent({
        type: "ball",
        batterId: currentGame!.currentStrikeId!,
        batterInningId,
        bowlerId: currentGame?.currentBowlerId,
        runs: -Math.abs(penalty) + extrasRuns,
        runBreakdown: {
          bat: -Math.abs(penalty),
          extras: extrasRuns,
        },
        isExtra: extrasRuns > 0,
        extraType: normalizeExtraType(selectedExtras[0]),
        countsAsBall,
        prevBatterId: currentGame?.currentStrikeId,
      });

      console.log("All events after add:", useMatchStore.getState().events);

      applyStrikeFromLastEvent();
      setDismissedBatterId(null);
      setDismissedKind(null);
      resetSelections();
      setConfirmingWicket(false);
      onClose();
      return;
    }

    // 🟨 Normal wicket
    if (hasWicket) {
      const kind = normalizeWicketKind(selectedWickets[0]);

      if (dismissedBatterId && dismissedKind) {
        const wicketObj = addWicket(
          dismissedBatterId,
          currentGame?.currentBowlerId,
          null, // can be extended to fielder later
          dismissedKind,
          totalRuns,
        );

        // Update bowler stats if applicable
        /*
        if (currentGame?.currentBowlerId) {
          updateBowlerStats(
            currentGame.currentBowlerId,
            totalRuns,
            countsAsBall ? 1 : 0,
            1, // 1 wicket
            normalizeExtraType(selectedExtras[0]) as
              | "wide"
              | "noBall"
              | undefined,
          );
        }
        */

        /*
        if (currentGame?.currentBowlerId) {
          const { ballsThisOver: actualBallsThisOver } = buildCurrentOverCircles(
            useMatchStore.getState().events,
            { wideIsExtraBall: useMatchStore.getState().wideIsExtraBall },
          );
        
          const overBallIndex = actualBallsThisOver % 6;
        
          updateBowlerStats(
            currentGame.currentBowlerId,
            totalRuns,
            countsAsBall ? 1 : 0,
            overBallIndex,
            normalizeExtraType(selectedExtras[0]) as "wide" | "noBall" | undefined,
          );
        }
        */

        if (currentGame?.currentBowlerId) {
          const { ballsThisOver: actualBallsThisOver } =
            buildCurrentOverCircles(useMatchStore.getState().events, {
              wideIsExtraBall: useMatchStore.getState().wideIsExtraBall,
            });

          const overBallIndex = actualBallsThisOver % 6;

          updateBowlerStats(
            currentGame.currentBowlerId,
            totalRuns,
            countsAsBall ? 1 : 0, // increment if countsAsBall
            overBallIndex,
            normalizeExtraType(selectedExtras[0]),
          );
        }

        const lastWicket = useGameStore.getState().currentGame?.wickets.at(-1);
        const wicketCopy = lastWicket ? { ...lastWicket } : undefined;

        addEvent({
          type: "wicket",
          batterId: currentGame!.currentStrikeId!,
          batterInningId,
          bowlerId: currentGame?.currentBowlerId,
          kind,
          runs: 0,
          isExtra,
          extraType: normalizeExtraType(selectedExtras[0]),
          countsAsBall: kind === "retired" ? false : true,
          runBreakdown: { bat, extras },
          wicket: wicketCopy,
          prevBatterId: currentGame?.currentStrikeId,
        } as Omit<MatchEvent, "id" | "timestamp">);
      }

      applyStrikeChange({
        bat: 0,
        extras: 0,
        runs: 0,
        countsAsBall: true,
      });

      console.log("All events after add:", useMatchStore.getState().events);

      if (currentGame?.currentBowlerId) {
        updateBowlerStats(
          currentGame.currentBowlerId,
          totalRuns,
          countsAsBall ? 1 : 0, // ← THIS increments balls
          1, // wicket
          normalizeExtraType(selectedExtras[0]),
        );
      }

      maybeUpdateBatter(strikeBatterId!); // ✅ make sure bowler stats updated for runs/balls
      /*
      // ← Add this snippet here
      if (currentGame.currentBowlerId) {
        updateBowlerStats(
          currentGame.currentBowlerId,
          0, // runs already counted above
          0, // ball counted above
          1, // increment wickets
          undefined,
        );
      }
        */

      applyStrikeFromLastEvent();
      setDismissedBatterId(null);
      setDismissedKind(null);
      resetSelections();
      handleDismissBatter(currentGame.currentStrikeId!);
      setConfirmingWicket(false);
      //onClose();
      return;
    }

    // 🟩 Normal ball
    addEvent({
      type: "ball",
      batterId: currentGame!.currentStrikeId!,
      batterInningId,
      bowlerId: currentGame?.currentBowlerId,
      runs,
      isExtra,
      extraType: normalizeExtraType(selectedExtras[0]),
      countsAsBall,
      runBreakdown: { bat, extras },
      prevBatterId: currentGame?.currentStrikeId,
    });

    console.log("All events after add:", useMatchStore.getState().events);

    applyStrikeFromLastEvent();

    setShowAdvanced(false);
    setDismissedBatterId(null);
    setDismissedKind(null);
    resetSelections();
    setConfirmingWicket(false);
    onClose();
  };

  const addPartnershipWicket = (count: 1 | 2) => {
    const strikeBatterId = currentGame?.currentStrikeId;

    const activeBatter = currentGame?.activeBatters.find(
      (b) => b.playerId === strikeBatterId,
    );

    const batterInningId = activeBatter?.batterInningId;

    for (let i = 0; i < count; i++) {
      addEvent({
        type: "wicket",
        batterId: currentGame!.currentStrikeId!,
        batterInningId,
        bowlerId: currentGame?.currentBowlerId,
        kind: "partnership",
        runs: 0,
        isExtra: false,
        countsAsBall: false,
        runBreakdown: { bat: 0, extras: 0 },
        prevBatterId: currentGame?.currentStrikeId,
      } as Omit<MatchEvent, "id" | "timestamp">);
    }

    console.log("All events after add:", useMatchStore.getState().events);

    resetSelections();
    setConfirmingWicket(false);
    onClose();
  };

  const toggleWicket = (wicket: string) => {
    console.log("toggleWicket tapped:", wicket); // 🔹 log tapped wicket

    setSelectedWickets([wicket]); // single selection

    if (wicket === "Retired") {
      console.log("Retired selected — opening DismissBatterModal"); // 🔹 log retired path
      setDismissedKind("retired");
      setShowDismissModal(true); // open modal first
    } else if (wicket !== "Partnership") {
      console.log(`${wicket} selected — opening DismissBatterModal`); // 🔹 log other wickets
      setDismissedKind(normalizeWicketKind(wicket));
      setShowDismissModal(true);
    }
  };

  const handleDismissBatter = (
    batterId: string,
    options?: { retired?: boolean },
  ) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.currentGame;
    if (!game) return;

    const active = game.activeBatters.find((b) => b.playerId === batterId);
    if (!active) return;

    console.log("Handling batter removal:", batterId, options);

    // 🔵 RETIRED FLOW
    if (options?.retired) {
      const updatedActive = game.activeBatters.filter(
        (b) => b.playerId !== batterId,
      );

      const updatedRetired = [
        ...(game.activeRetired ?? []),
        active, // copy exact ActiveBatter object
      ];

      gameStore.updateCurrentGame({
        activeBatters: updatedActive,
        activeRetired: updatedRetired,
        currentStrikeId:
          game.currentStrikeId === batterId
            ? updatedActive[0]?.playerId
            : game.currentStrikeId,
      });

      setShowPlayerSelect("batter");
      return;
    }

    // 🔴 NORMAL DISMISSAL FLOW
    gameStore.dismissBattingEntry(active.batterInningId, {
      kind: "bowled", // you already pass real kind elsewhere
      bowlerId: game.currentBowlerId,
    });

    const updatedActive = game.activeBatters.filter(
      (b) => b.playerId !== batterId,
    );

    gameStore.updateCurrentGame({
      activeBatters: updatedActive,
      currentStrikeId:
        game.currentStrikeId === batterId
          ? updatedActive[0]?.playerId
          : game.currentStrikeId,
    });

    setShowPlayerSelect("batter");
  };

  const isRetirement = selectedWickets.includes("Retired");

  return (
    <>
      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={onClose}
      >
        <Wrapper style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.title}>Select Ball Outcome</Text>
              <Text style={styles.subtitle}>
                Select more than one option if needed (i.e. 5 + wides, or 1 +
                runout, or 1 + wide + sumpted, etc)
              </Text>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Accordion toggle */}
                <Pressable
                  onPress={() => setShowAdvanced((prev) => !prev)}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={{ fontWeight: "700", color: "#007AFF" }}>
                    {showAdvanced
                      ? "- Hide Game Settings"
                      : "+ Show Game Settings"}
                  </Text>
                </Pressable>

                {/* Collapsible section */}
                {showAdvanced && (
                  <>
                    <View style={styles.divider} />
                    <MatchRulesSettings />
                    <BallReminderSettings compact showDescription={false} />
                    <View style={{ marginTop: 10 }} />
                    <BaseRunsInput />
                    <View style={styles.divider} />
                  </>
                )}
                {!retireOnlyMode && (
                  <>
                    <Text style={styles.sectionTitle}>Runs</Text>
                    <View style={styles.grid}>
                      {runOptions.map((run) => (
                        <TouchableOpacity
                          key={run}
                          style={[
                            styles.optionButton,
                            selectedRuns === run && styles.optionSelected,
                          ]}
                          onPress={() => setSelectedRuns(run)}
                        >
                          <Text style={styles.optionText}>{run}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <CustomRunsInput
                      value={selectedRuns}
                      onChange={(runs) => setSelectedRuns(runs)}
                    />
                  </>
                )}
                {!retireOnlyMode && (
                  <>
                    <Text style={styles.sectionTitle}>Extras</Text>
                    <Text style={styles.subtitleLeft}>
                      Selecting an extra will automatically add 1 run. If you
                      want to add more runs with an extra, first select the
                      number of runs above, then select the extra. For example,
                      a wide plus 4 runs equals 5 runs, so you would select 5
                      runs followed by the wide.
                    </Text>
                    <View style={styles.grid}>
                      {extraOptions.map((extra) => (
                        <TouchableOpacity
                          key={extra}
                          style={[
                            styles.optionButton,
                            selectedExtras.includes(extra) &&
                              styles.optionSelected,
                          ]}
                          onPress={() => toggleExtra(extra)}
                        >
                          <Text style={styles.optionText}>{extra}</Text>

                          {/* Only show batRuns selector under No Ball */}
                          {extra === "No Ball" &&
                            selectedExtras.includes("No Ball") &&
                            selectedRuns !== null &&
                            selectedRuns > 1 && (
                              <>
                                <Text style={styles.sectionTitle}>
                                  Runs off the bat
                                </Text>
                                <View style={styles.grid}>
                                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                                    <TouchableOpacity
                                      key={r}
                                      style={[
                                        styles.optionButton,
                                        batRuns === r &&
                                          styles.optionSelectedNoBallBat,
                                      ]}
                                      onPress={() => {
                                        setBatRuns(r as any);
                                        console.log(
                                          "Runs off bat selected:",
                                          r,
                                        ); // <-- LOG HERE
                                      }}
                                    >
                                      <Text style={styles.optionText}>{r}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </>
                            )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                {wicketsAsNegativeRuns && (
                  <>
                    <Text style={styles.sectionTitle}>End Partnership</Text>

                    <View style={styles.grid}>
                      <TouchableOpacity
                        style={[styles.optionButton, styles.wicketAction]}
                        onPress={() => addPartnershipWicket(1)}
                      >
                        <Text style={styles.optionText}>End Batter</Text>
                        <Text style={styles.optionSubText}>Adds 1 wicket</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.optionButton, styles.wicketAction]}
                        onPress={() => addPartnershipWicket(2)}
                      >
                        <Text style={styles.optionText}>End Partnership</Text>
                        <Text style={styles.optionSubText}>Adds 2 wickets</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {wicketsAsNegativeRuns && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      Wickets are recorded as negative runs.
                    </Text>
                    <Text style={styles.warningSubtext}>
                      Use a wicket option below to add negative runs, and use{" "}
                      <Text style={styles.bold}>End Partnership</Text> (adds 2
                      wickets) or <Text style={styles.bold}>End Batter</Text>{" "}
                      (adds 1 wicket) to end the partnership.
                    </Text>
                  </View>
                )}
                <Text style={styles.sectionTitle}>Wickets</Text>
                {retireOnlyMode && (
                  <Text
                    style={{
                      textAlign: "center",
                      marginBottom: 10,
                      fontWeight: "600",
                    }}
                  >
                    End of Over — Retire or End Partnership Only
                  </Text>
                )}
                {dismissedBatterId && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "700", marginRight: 8 }}>
                      Dismissing:{" "}
                      {
                        battingTeam?.players.find(
                          (p) => p.id === dismissedBatterId,
                        )?.name
                      }
                    </Text>
                    <Pressable
                      onPress={() => setShowDismissModal(true)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: "#eee",
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: "#007AFF" }}>Change</Text>
                    </Pressable>
                  </View>
                )}
                <View style={styles.grid}>
                  {wicketOptions
                    .filter((w) => (retireOnlyMode ? w === "Retired" : true))
                    .map((w) => (
                      <TouchableOpacity
                        key={w}
                        style={[
                          styles.optionButton,
                          selectedWickets.includes(w) && styles.optionSelected,
                        ]}
                        onPress={() => {
                          console.log("Wicket button pressed:", w); // 🔹 log button press
                          toggleWicket(w);
                          if (w !== "Retired" && w !== "Partnership") {
                            setShowDismissModal(true);
                          }
                        }}
                      >
                        <Text style={styles.optionText}>{w}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              <Pressable style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>
                  {dismissedBatterId
                    ? `Add & Dismiss ${battingTeam?.players.find((p) => p.id === dismissedBatterId)?.name}`
                    : "Add Ball"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setShowAdvanced(false);
                  onClose();
                }}
              >
                <Text style={styles.closeText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Wrapper>

        <DismissBatterModal
          visible={showDismissModal}
          mode={dismissedKind === "retired" ? "retire" : "dismiss"}
          batters={batterPlayers.map((p) => {
            const bEntry = currentGame?.battingEntries.find(
              (e) => e.playerId === p.id,
            );
            return { ...p, retired: bEntry?.retired }; // 🔹 include retired flag
          })}
          currentBatterId={currentGame?.currentStrikeId ?? null}
          onClose={() => setShowDismissModal(false)}
          onContinue={(selectedId) => {
            setDismissedBatterId(selectedId);
            setShowDismissModal(false);
            setStrike(selectedId); // optional, pre-select for change
          }}
        />

        {showPlayerSelect === "batter" && battingTeam && (
          <SelectPlayersModal
            visible={true}
            onClose={() => {
              setShowPlayerSelect(null); // hide player modal
              onClose(); // also close RunModal
            }}
            title={`Select Next Batter for ${battingTeam.name}`}
            players={battingTeam.players}
            selectedIds={selectedBatters}
            onSelectionChange={(ids) => {
              if (ids.length === 0) return;

              const newStrike = ids[0];
              setStrike(newStrike);

              setShowPlayerSelect(null);
              onClose();
            }}
            selectionMode="multiple"
            pickerType="batter"
          />
        )}

        {confirmingWicket && (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>
                {isRetirement ? "Confirm Retirement" : "Confirm Wicket"}
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Bowler</Text>
                <Text style={styles.value}>{currentBowlerName ?? "—"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Batter</Text>
                <Text style={styles.value}>{currentBatterName ?? "—"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>How out</Text>
                <Text style={styles.value}>{selectedWickets[0]}</Text>
              </View>

              <Text style={styles.warning}>
                ⚠️ This action cannot be undone
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setConfirmingWicket(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => {
                    setConfirmingWicket(false);
                    handleSubmit();
                  }}
                >
                  <Text style={styles.confirmText}>
                    {isRetirement ? "Confirm Retirement" : "Confirm Wicket"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  scrollContent: { paddingBottom: 20 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "300",
    marginBottom: 10,
    textAlign: "center",
    color: "#666",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 4 },
  subtitleLeft: {
    fontSize: 12,
    fontWeight: "300",
    marginBottom: 16,
    color: "#666",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionButton: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginBottom: 10,
    width: "48%",
    alignItems: "center",
  },
  optionSelected: { backgroundColor: "#77dd77" },
  optionSelectedNoBallBat: { backgroundColor: "#12c2e9" },
  optionText: { fontSize: 16, fontWeight: "600" },
  optionSubText: { fontSize: 12, color: "#666", marginTop: 2 },
  wicketAction: { backgroundColor: "#f0f0f0" },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#77dd77",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  closeButton: { marginTop: 10, alignItems: "center", marginBottom: 5 },
  closeText: { color: "#c471ed", fontSize: 16, fontWeight: "600" },
  warningBox: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ffeeba",
  },
  warningText: {
    fontWeight: "700",
    fontSize: 13,
  },
  warningSubtext: {
    fontSize: 12,
    color: "#555",
  },
  bold: {
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#999",
    marginVertical: 10, // optional spacing above and below
  },
  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  confirmBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    borderWidth: 3,
    borderColor: "#D32F2F", // 🔴 red danger border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#D32F2F",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  label: {
    fontSize: 14,
    color: "#666",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  warning: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 14,
    color: "#D32F2F",
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  confirmBtn: {
    flex: 1,
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  confirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
