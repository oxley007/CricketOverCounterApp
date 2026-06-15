import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import InningsTabs from "../../components/InningsTabs";
import { useFixtureStore } from "../../state/fixtureStore";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

export default function FixtureScorecardScreen() {
  const { fixtureId, from } = useLocalSearchParams<{
    fixtureId?: string;
    from?: string;
  }>();

  const router = useRouter();

  const fixtures = useFixtureStore((s) => s.fixtures);
  const currentFixture = useFixtureStore((s) => s.currentFixture);

  const fixture = fixtureId
    ? (fixtures.find((f) => f.id === fixtureId) ?? currentFixture)
    : currentFixture;

  if (!fixture) {
    return (
      <View style={styles.screen}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            No fixture in progress. Start a match from the ball counter to see
            the scorecard here, or open a completed fixture from your list.
          </Text>

          {from === "scorebook" && (
            <Pressable
              onPress={() => router.push("/scorebook")}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonActive,
              ]}
            >
              {/* Material Arrow Icon */}
              <Icon name="arrow-left" size={20} color="#7fdaff" />

              {/* Button Label */}
              <Text style={styles.label}>Back to Scorebook</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  console.log(from, "si from where?");

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {from === "scorebook" && (
          <Pressable
            onPress={() => router.push("/scorebook")}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonActive,
            ]}
          >
            {/* Material Arrow Icon */}
            <Icon name="arrow-left" size={20} color="#7fdaff" />

            {/* Button Label */}
            <Text style={styles.label}>Back to Scorebook</Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        <View style={styles.scorecardWrapper}>
          <InningsTabs fixture={fixture} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b1326",
  },

  container: {
    padding: 10,
    paddingBottom: 120,
  },

  divider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginVertical: 10,
  },

  backLink: {
    fontSize: 16,
    textDecorationLine: "underline",
    color: "#fff",
    marginBottom: 10,
  },

  placeholder: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  scorecardWrapper: {
    //backgroundColor: "#fff",
    //borderRadius: 12,
    //padding: 12,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Maps to Tailwind gap-2 (2 * 4px = 8px)
  },
  buttonActive: {
    transform: [{ scale: 0.95 }], // Maps to active:scale-95
  },
  icon: {
    fontFamily: "Material Symbols Outlined",
    fontSize: 20, // Maps to text-[20px]
    color: "#7fdaff", // Maps to theme.extend.colors.primary
  },
  label: {
    fontFamily: "Geist", // Maps to font-label-caps
    fontSize: 12, // Maps to text-label-caps
    lineHeight: 16,
    letterSpacing: 0.96, // Converts 0.08em tracking to physical points (12px * 0.08)
    fontWeight: "600",
    textTransform: "uppercase", // Maps to uppercase
    color: "#7fdaff", // Maps to theme.extend.colors.primary
  },
});
