import React from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useMatchStore } from "../../state/matchStore";

export default function MatchRulesSettings() {
  const {
    wideIsExtraBall,
    wicketsAsNegativeRuns,
    wicketPenaltyRuns,
    autoSwapStrikeAfterWicket,
    wicketPenaltyAffectsBatter,
    wicketPenaltyAffectsBowler,
    wideExtraBallThreshold,
    setWideIsExtraBall,
    setWideExtraBallThreshold,
    setWicketsAsNegativeRuns,
    setWicketPenaltyRuns,
    setAutoSwapStrikeAfterWicket,
    setWicketPenaltyAffectsBatter,
    setWicketPenaltyAffectsBowler,
  } = useMatchStore();

  return (
    <View style={styles.container}>
      {/* Wide rule */}
      <View style={styles.row}>
        <Text style={styles.label}>Wide as extra ball</Text>
        <Switch value={wideIsExtraBall} onValueChange={setWideIsExtraBall} />
      </View>

      <Text style={styles.helper}>
        If off, wides count as runs but do not count as extra deliveries (junior
        cricket). If on, you can optionally limit the number of wides per over
        that count as extra balls.
      </Text>

      {wideIsExtraBall && (
        <>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Limit wides counted as extra balls</Text>
            <TextInput
              value={String(wideExtraBallThreshold)}
              onChangeText={(v) =>
                setWideExtraBallThreshold(parseInt(v, 10) || 0)
              }
              keyboardType="numeric"
              style={styles.input}
              placeholder="0 = unlimited"
            />
          </View>

          <Text style={styles.helper}>
            Set to 0 for normal cricket wide rules., or set a limit for how many
            wides per over count as extra balls (e.g., 2). Any wides beyond this
            limit will add runs but will not result in an extra delivery.
          </Text>
        </>
      )}

      {/* Wicket rule */}
      <View style={styles.row}>
        <Text style={styles.label}>Wickets subtract runs from total score</Text>
        <Switch
          value={wicketsAsNegativeRuns}
          onValueChange={setWicketsAsNegativeRuns}
        />
      </View>

      <Text style={styles.helper}>
        If on, wickets count as neagtive runs to total score instead dismissing
        a batter (junior cricket)
      </Text>

      {wicketsAsNegativeRuns && (
        <>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Negative runs per wicket</Text>
            <TextInput
              value={String(wicketPenaltyRuns)}
              onChangeText={(v) => setWicketPenaltyRuns(parseInt(v, 10) || 0)}
              keyboardType="numeric"
              style={styles.input}
              placeholder="-5"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Auto-swap strike after wicket</Text>
            <Switch
              value={autoSwapStrikeAfterWicket}
              onValueChange={setAutoSwapStrikeAfterWicket}
            />
          </View>
          <Text style={styles.helper}>
            If enabled, the on-strike batter will automatically swap after a
            wicket is recorded
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Apply negative runs to batter</Text>
            <Switch
              value={wicketPenaltyAffectsBatter}
              onValueChange={setWicketPenaltyAffectsBatter}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Apply negative runs to bowler</Text>
            <Switch
              value={wicketPenaltyAffectsBowler}
              onValueChange={setWicketPenaltyAffectsBowler}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    width: 60,
    borderRadius: 4,
  },
  helper: {
    fontSize: 12,
    color: "#333",
    marginBottom: 10,
  },
});
