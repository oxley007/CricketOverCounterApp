import React, { useMemo, useState } from "react";
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
import { useGameStore } from "../../state/gameStore";
import { useMatchStore, type MatchEvent } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import BallReminderSettings from "../BallReminder/BallReminderSettings";
import SelectPlayersModal from "../Scorebook/SelectPlayersModal";
import BaseRunsInput from "../Settings/BaseRunsInput";
import CustomRunsInput from "./CustomRunsInput";
import MatchRulesSettings from "./MatchRulesSettings";
import PlayerSelectorRow from "./PlayerSelectorRow";

interface RunModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RunModal({ visible, onClose }: RunModalProps) {
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
  const teams = useTeamStore((s) => s.teams);

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
    return (currentGame.batters ?? []).map((b) => {
      const p = battingTeam.players.find((pl) => pl.id === b.playerId);
      return { id: b.playerId, name: p?.name ?? b.playerId };
    });
  }, [currentGame?.batters, battingTeam]);

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

  const toggleWicket = (wicket: string) => {
    setSelectedWickets(
      (prev) => (prev.includes(wicket) ? [] : [wicket]), // single selection
    );
  };

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
    const isExtra = selectedExtras.length > 0;
    const hasWicket = selectedWickets.length > 0;
    const isScoringWicket = wicketsAsNegativeRuns && hasWicket;

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

    // 🧠 Helpers (now safe — bat/extras/countsAsBall exist)
    const maybeUpdateBatter = () => {
      if (!inScorebookMode || !currentGame?.currentStrikeId) return;
      if (bat === 0 && !countsAsBall) return;

      // Update batter stats
      updateBatterStats(currentGame.currentStrikeId, bat, countsAsBall ? 1 : 0);

      // Update bowler stats
      if (currentGame.currentBowlerId) {
        let bowlerRuns = bat + extras; // all runs conceded
        updateBowlerStats(
          currentGame.currentBowlerId,
          bowlerRuns,
          countsAsBall ? 1 : 0, // only legal balls count
          0, // wickets handled separately
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

      maybeUpdateBatter();

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
        bowlerId: currentGame?.currentBowlerId,
        runs: -Math.abs(penalty) + extrasRuns,
        runBreakdown: {
          bat: -Math.abs(penalty),
          extras: extrasRuns,
        },
        isExtra: extrasRuns > 0,
        extraType: normalizeExtraType(selectedExtras[0]),
        countsAsBall,
      });

      applyStrikeFromLastEvent();
      resetSelections();
      onClose();
      return;
    }

    // 🟨 Normal wicket
    if (hasWicket) {
      const kind = normalizeWicketKind(selectedWickets[0]);

      addEvent({
        type: "wicket",
        batterId: currentGame!.currentStrikeId!,
        bowlerId: currentGame?.currentBowlerId,
        kind,
        runs: 0,
        isExtra,
        extraType: normalizeExtraType(selectedExtras[0]),
        countsAsBall: kind === "retired" ? false : true,
        runBreakdown: { bat, extras },
      } as Omit<MatchEvent, "id" | "timestamp">);

      maybeUpdateBatter(); // ✅ make sure bowler stats updated for runs/balls

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

      applyStrikeFromLastEvent();
      resetSelections();
      onClose();
      return;
    }

    // 🟩 Normal ball
    addEvent({
      type: "ball",
      batterId: currentGame!.currentStrikeId!,
      bowlerId: currentGame?.currentBowlerId,
      runs,
      isExtra,
      extraType: normalizeExtraType(selectedExtras[0]),
      countsAsBall,
      runBreakdown: { bat, extras },
    });

    applyStrikeFromLastEvent();

    setShowAdvanced(false);
    resetSelections();
    onClose();
  };

  const addPartnershipWicket = (count: 1 | 2) => {
    for (let i = 0; i < count; i++) {
      addEvent({
        type: "wicket",
        batterId: currentGame!.currentStrikeId!,
        bowlerId: currentGame?.currentBowlerId,
        kind: "partnership",
        runs: 0,
        isExtra: false,
        countsAsBall: false,
        runBreakdown: { bat: 0, extras: 0 },
      } as Omit<MatchEvent, "id" | "timestamp">);
    }

    resetSelections();
    onClose();
  };

  const addRetiredWicket = () => {
    addEvent({
      type: "wicket",
      batterId: currentGame!.currentStrikeId!,
      bowlerId: currentGame?.currentBowlerId,
      kind: "retired",
      runs: 0,
      isExtra: false,
      countsAsBall: false,
      runBreakdown: { bat: 0, extras: 0 },
    } as Omit<MatchEvent, "id" | "timestamp">);

    resetSelections();
    onClose();
  };

  return (
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
              {inScorebookMode && (
                <>
                  <Text style={styles.sectionTitle}>Players</Text>
                  <PlayerSelectorRow
                    label="Batter"
                    selectedName={currentBatterName}
                    placeholder="Select batter"
                    onPress={() => setShowPlayerSelect("batter")}
                  />
                  {bowlingTeam && (
                    <PlayerSelectorRow
                      label="Bowler"
                      selectedName={currentBowlerName}
                      placeholder="Select bowler"
                      onPress={() => setShowPlayerSelect("bowler")}
                    />
                  )}
                </>
              )}
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

              <Text style={styles.sectionTitle}>Extras</Text>
              <Text style={styles.subtitleLeft}>
                Selecting an extra will automatically add 1 run. If you want to
                add more runs with an extra, first select the number of runs
                above, then select the extra. For example, a wide plus 4 runs
                equals 5 runs, so you would select 5 runs followed by the wide.
              </Text>
              <View style={styles.grid}>
                {extraOptions.map((extra) => (
                  <TouchableOpacity
                    key={extra}
                    style={[
                      styles.optionButton,
                      selectedExtras.includes(extra) && styles.optionSelected,
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
                                  console.log("Runs off bat selected:", r); // <-- LOG HERE
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
              <View style={styles.grid}>
                {wicketOptions.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.optionButton,
                      selectedWickets.includes(w) && styles.optionSelected,
                    ]}
                    onPress={() => toggleWicket(w)}
                  >
                    <Text style={styles.optionText}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Add Ball</Text>
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

      {showPlayerSelect === "batter" && batterPlayers.length > 0 && (
        <SelectPlayersModal
          visible={true}
          onClose={() => setShowPlayerSelect(null)}
          title="Select batter on strike"
          players={batterPlayers}
          selectedIds={
            currentGame?.currentStrikeId ? [currentGame.currentStrikeId] : []
          }
          onSelectionChange={(ids) => {
            if (ids[0]) setStrike(ids[0]);
            setShowPlayerSelect(null);
          }}
          selectionMode="single"
        />
      )}
      {showPlayerSelect === "bowler" && bowlingTeam && (
        <SelectPlayersModal
          visible={true}
          onClose={() => setShowPlayerSelect(null)}
          title="Select bowler"
          players={bowlingTeam.players}
          selectedIds={
            currentGame?.currentBowlerId ? [currentGame.currentBowlerId] : []
          }
          onSelectionChange={(ids) => {
            if (ids[0]) setCurrentBowler(ids[0]);
            setShowPlayerSelect(null);
          }}
          selectionMode="single"
        />
      )}
    </Modal>
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
});
