  import React, { useState } from "react";
  import {
    View,
    Text,
    Pressable,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
  } from "react-native";
  import { useMatchStore } from "../../state/matchStore";
  import MatchRulesSettings from "./MatchRulesSettings";
  import BallReminderSettings from "../BallReminder/BallReminderSettings";
  import BaseRunsInput from "../Settings/BaseRunsInput";
  import { SafeAreaView } from "react-native-safe-area-context";

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
    const [selectedRuns, setSelectedRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | null>(null);
    const [batRuns, setBatRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [selectedWickets, setSelectedWickets] = useState<string[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);


    const runOptions = [1, 2, 3, 4, 5, 6];
    const extraOptions = ["Wide", "No Ball", "Bye", "Leg Bye", "Penalty"];
    const wicketOptions = ["Bowled", "Caught", "LBW", "Stumped", "Run Out", "Hit Wicket", "Retired"];

    const resetSelections = () => {
      setSelectedRuns(null);
      setSelectedExtras([]);
      setSelectedWickets([]);
    };

    const toggleExtra = (extra: string) => {
      setSelectedExtras((prev) =>
        prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
      );
    };

    const toggleWicket = (wicket: string) => {
      setSelectedWickets((prev) =>
        prev.includes(wicket) ? prev.filter((w) => w !== wicket) : [...prev, wicket]
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

        const isScoringWicket =
          wicketsAsNegativeRuns && selectedWickets.length > 0;

        if (
          isScoringWicket &&
          (selectedRuns !== null || selectedExtras.length > 0)
        ) {
          // show toast: "Runs/extras are not added when wickets score negative runs"
          return;
        }

        const totalRuns = selectedRuns ?? 0;
        const isNoBall = selectedExtras.includes("No Ball");
        const isWide = selectedExtras.includes("Wide");

        // Default breakdown
        let bat = 0;
        let extras = 0;

        // 🟥 No ball logic
        if (isNoBall) {
          extras = 1;

          if (totalRuns > 1) {
            bat = batRuns ?? (totalRuns - 1);
          }
        }

        // 🟦 Wide logic
        else if (isWide) {
          bat = 0;
          extras = totalRuns || 1;
        }

        // 🟩 Normal ball
        else {
          bat = totalRuns;
          extras = 0;
        }

        const runs = bat + extras;

        const countsAsBall = !isWide || !wideIsExtraBall;

        // Determine if this is a retired wicket
        const isRetired = selectedWickets.includes("Retired");
        const isPartnership = selectedWickets.includes("Partnership"); // if needed

        // 🟥 Wicket as negative runs
        if (hasWicket && wicketsAsNegativeRuns && !isRetired && !isPartnership) {
          const penalty = wicketPenaltyRuns || 0;

          addEvent({
            type: "ball", // scoring adjustment, not a real delivery
            runs: -Math.abs(penalty),
            runBreakdown: { bat: 0, extras: 0 },
            isExtra: false,
            extraType: undefined,
            countsAsBall,
          });

          resetSelections();
          onClose();
          return;
        }

        // 🟨 Normal wicket
        if (hasWicket) {
          const kind = normalizeWicketKind(selectedWickets[0]);

          addEvent({
            type: "wicket",
            kind,
            runs: 0, // always 0 for retired
            isExtra,
            extraType: normalizeExtraType(selectedExtras[0]),
            countsAsBall: kind === "retired" ? false : true, // ✅ retired doesn't count as ball
            runBreakdown: { bat: bat, extras: extras },
          });

          resetSelections();
          onClose();
          return;
        }

        // 🟩 Normal ball
        addEvent({
          type: "ball",
          runs,
          isExtra,
          extraType: normalizeExtraType(selectedExtras[0]),
          countsAsBall,
        });


        resetSelections();
        onClose();
      };

      const addPartnershipWicket = (count: 1 | 2) => {
        for (let i = 0; i < count; i++) {
          addEvent({
            type: "wicket",
            kind: "partnership",
            runs: 0,
            isExtra: false,
            countsAsBall: false, // 👈 KEY FIX
          });
        }

        resetSelections();
        onClose();
      };

      const addRetiredWicket = () => {
        addEvent({
          type: "wicket",
          kind: "retired",
          runs: 0,
          isExtra: false,
          countsAsBall: false,
        });

        resetSelections();
        onClose();
      };

    return (
      <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <Wrapper style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Select Ball Outcome</Text>
            <Text style={styles.subtitle}>Select more than one option if needed (i.e. 5 + wides, or 1 + runout, or 1 + wide + sumpted, etc)</Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Accordion toggle */}
            <Pressable
              onPress={() => setShowAdvanced((prev) => !prev)}
              style={{ paddingVertical: 8 }}
            >
              <Text style={{ fontWeight: "700", color: "#007AFF" }}>
                {showAdvanced ? "- Hide Game Settings" : "+ Show Game Settings"}
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

              <Text style={styles.sectionTitle}>Extras</Text>
              <Text style={styles.subtitleLeft}>Selecting an extra will automatically add 1 run. If you want to add more runs with an extra, first select the number of runs above, then select the extra. For example, a wide plus 4 runs equals 5 runs, so you would select 5 runs followed by the wide.</Text>
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
                      <Text style={styles.sectionTitle}>Runs off the bat</Text>
                      <View style={styles.grid}>
                      {[0,1,2,3,4,5,6].map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.optionButton, batRuns === r && styles.optionSelectedNoBallBat]}
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
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    Wickets are recorded as negative runs.
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Use a wicket option to add negative runs, and use <Text style={styles.bold}>End Partnership</Text> (adds 2 wickets) or <Text style={styles.bold}>End Batter</Text> (adds 1 wicket) to end the partnership.
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
            </ScrollView>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Add Ball</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
        </Wrapper>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: "70%" },
    scrollContent: { paddingBottom: 20 },
    title: { fontSize: 18, fontWeight: "700", marginBottom: 6, textAlign: "center" },
    subtitle: { fontSize: 12, fontWeight: "300", marginBottom: 10, textAlign: "center", color: '#666'},
    sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 4 },
    subtitleLeft: { fontSize: 12, fontWeight: "300", marginBottom: 16, color: '#666'},
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    optionButton: { padding: 12, backgroundColor: "#eee", borderRadius: 8, marginBottom: 10, width: "48%", alignItems: "center" },
    optionSelected: { backgroundColor: "#77dd77" },
    optionSelectedNoBallBat: { backgroundColor: "#12c2e9" },
    optionText: { fontSize: 16, fontWeight: "600" },
    submitButton: { marginTop: 10, backgroundColor: "#77dd77", padding: 12, borderRadius: 8, alignItems: "center" },
    submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
    closeButton: { marginTop: 10, alignItems: "center" },
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
