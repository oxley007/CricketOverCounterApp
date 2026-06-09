import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMatchStore } from "../../state/matchStore";

type Props = {
  compact?: boolean;
  showDescription?: boolean;
};

export default function BallReminderSettings(props: Props = {}) {
  const { compact = false, showDescription = true } = props;

  const {
    ballReminderEnabled,
    ballReminderThresholdPercent,
    setBallReminderEnabled,
    setBallReminderThresholdPercent,
  } = useMatchStore();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, compact && styles.compact]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Ball reminder</Text>
        <Switch
          value={ballReminderEnabled}
          onValueChange={setBallReminderEnabled}
        />
      </View>

      {showDescription && (
        <Text style={styles.help}>
          Vibrates if a ball hasn’t been counted within the expected time.
        </Text>
      )}

      {ballReminderEnabled && (
        <>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Threshold</Text>
            <TextInput
              keyboardType="numeric"
              value={String(ballReminderThresholdPercent)}
              onChangeText={(val) =>
                setBallReminderThresholdPercent(Number(val))
              }
              style={styles.input}
            />
            <Text style={styles.suffix}>%</Text>
          </View>
          <Text style={styles.help}>
            Threshold: Avg. time per ball + buffer. (e.g., if avg. is 30s and
            threshold is 33%, you’ll get a vibrate alert at 40s if no ball has
            been scored).
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20, // 👈 horizontal padding
    paddingVertical: 16,
    borderRadius: 12,
  },
  compact: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 8,
    backgroundColor: "#fff",
  },
  suffix: {
    fontSize: 16,
  },
  help: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
});
