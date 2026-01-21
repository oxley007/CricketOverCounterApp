import React from "react";
import {
  View,
  Text,
  Switch,
  TextInput,
  StyleSheet,
  ScrollView,
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
      contentContainerStyle={[
        styles.container,
        compact && styles.compact,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Ball reminder</Text>
        <Switch
          value={ballReminderEnabled}
          onValueChange={setBallReminderEnabled}
        />
      </View>

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

          {showDescription && (
            <Text style={styles.help}>
              Vibrates if a ball hasn’t been counted within the expected time.
            </Text>
          )}
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
    marginBottom: 16,
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
    backgroundColor: '#fff'
  },
  suffix: {
    fontSize: 16,
  },
  help: {
    fontSize: 14,
    color: "#666",
  },
});
