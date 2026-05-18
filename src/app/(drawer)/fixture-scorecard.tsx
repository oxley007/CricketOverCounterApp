import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import InningsTabs from "../../components/InningsTabs";
import { useFixtureStore } from "../../state/fixtureStore";

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
            <Text
              style={styles.backLink}
              onPress={() => router.push("/scorebook")} // Forces navigation back to Scorebook layout
            >
              ← Back to Scorebook
            </Text>
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
          <Text
            style={styles.backLink}
            onPress={() => router.push("/scorebook")} // Forces navigation back to Scorebook layout
          >
            ← Back to Scorebook
          </Text>
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
    backgroundColor: "#12c2e9",
  },

  container: {
    padding: 20,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
});
