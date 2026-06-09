// src/components/EventList.tsx
import { View, Text, StyleSheet } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function EventList() {
  const { events } = useMatchStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events:</Text>
      {events.map((e) => (
        <Text key={e.id}>
          {e.type === "ball" ? `Ball: ${e.runs} run(s)` : `Wicket: ${e.kind}`}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 18, fontWeight: "500", marginBottom: 10 },
});
