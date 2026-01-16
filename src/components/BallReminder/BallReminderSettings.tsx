import React from "react";
import { View, Text, Switch, TextInput } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import { styles } from "./styles";

type Props = {
  compact?: boolean;
  showDescription?: boolean;
};

export default function BallReminderSettings(props: Props = {}) {
  // destructure inside the body safely
  const { compact = false, showDescription = true } = props;

  const {
    ballReminderEnabled,
    ballReminderThresholdPercent,
    setBallReminderEnabled,
    setBallReminderThresholdPercent,
  } = useMatchStore();

  return (
    <View style={[styles.container, compact && styles.compact]}>
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
    </View>
  );
}
