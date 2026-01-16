import React from "react";
import { View, Text, Switch, TextInput, StyleSheet } from "react-native";
import { useMatchStore } from "../../state/matchStore";

export default function MatchRulesSettings() {
  const {
    wideIsExtraBall,
    wicketsAsNegativeRuns,
    wicketPenaltyRuns,
    setWideIsExtraBall,
    setWicketsAsNegativeRuns,
    setWicketPenaltyRuns,
  } = useMatchStore();

  return (
    <View style={styles.container}>

      {/* Wide rule */}
      <View style={styles.row}>
        <Text style={styles.label}>Wide as extra ball</Text>
        <Switch
          value={wideIsExtraBall}
          onValueChange={setWideIsExtraBall}
        />
      </View>

      <Text style={styles.helper}>
        If off, wides count as runs but do not count as an extra delivery (junior cricket).
      </Text>

      {/* Wicket rule */}
      <View style={styles.row}>
        <Text style={styles.label}>Wickets as negative runs</Text>
        <Switch
          value={wicketsAsNegativeRuns}
          onValueChange={setWicketsAsNegativeRuns}
        />
      </View>

      <Text style={styles.helper}>
        If on, wickets count as neagtive runs instead of a wicket (junior cricket)
      </Text>

      {wicketsAsNegativeRuns && (
        <View style={styles.inputRow}>
          <Text style={styles.label}>Runs per wicket</Text>
          <TextInput
            value={String(wicketPenaltyRuns)}
            onChangeText={(v) =>
              setWicketPenaltyRuns(parseInt(v, 10) || 0)
            }
            keyboardType="numeric"
            style={styles.input}
            placeholder="-5"
          />
        </View>
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
    color: "#666",
    marginBottom: 10,
  },
});
