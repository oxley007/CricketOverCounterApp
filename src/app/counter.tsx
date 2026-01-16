import { View, Text, Button, StyleSheet } from "react-native";
import { useCounterStore } from "../state/counterStore";

export default function CounterScreen() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter: {count}</Text>
      <View style={styles.buttons}>
        <Button title="+" onPress={increment} />
        <Button title="-" onPress={decrement} />
        <Button title="Reset" onPress={reset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 20 },
  buttons: { flexDirection: "row", gap: 10 },
});
