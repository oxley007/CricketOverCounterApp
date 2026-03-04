import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFixtureStore } from "../../state/fixtureStore";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";

export default function StartModeModal() {
  const isOpen = useStartModalStore((s) => s.isOpen);
  const selectBallCounter = useStartModalStore((s) => s.selectBallCounter);
  const selectScorebook = useStartModalStore((s) => s.selectScorebook);
  const openMatchRulesModal = useMatchStore((s) => s.openMatchRulesModal);
  const closeStartModal = useStartModalStore((s) => s.close);

  const clearAllFixtures = useFixtureStore((s) => s.clearAllFixtures);
  const fixtures = useFixtureStore((s) => s.fixtures);

  // Force re-render whenever store updates (helps with hydration & reset)
  const [, setTick] = useState(0);
  useEffect(() => {
    // Subscribe to store changes
    const unsub = useStartModalStore.subscribe(
      (state) => state.isOpen,
      () => setTick((t) => t + 1), // trigger re-render
    );
    return unsub;
  }, []);

  const onBallCounter = () => {
    selectBallCounter();
    openMatchRulesModal();
  };

  const onScorebook = () => {
    closeStartModal(); // 👈 CLOSE THIS FIRST
    selectScorebook();
    // Use a tiny timeout to let the modal close animation finish before navigating
    setTimeout(() => {
      router.replace("/scorebook");
    }, 100);
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/4dot6logo-transparent.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerText}>Select your mode</Text>
          </View>

          {/* Ball Counter Card */}
          <Pressable
            style={[styles.card, styles.ballCounter]}
            onPress={onBallCounter}
          >
            <Image
              source={require("../../../assets/4dot6logo-transparent.png")}
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={[styles.cardText, styles.ballCounterText]}>
              Ball Counter
            </Text>
          </Pressable>

          {/* Scorebook Card */}
          <Pressable
            style={[styles.card, styles.scorebook]}
            onPress={onScorebook}
          >
            <Image
              source={require("../../../assets/4dot6logo-transparent-old_inverse.png")}
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={[styles.cardText, styles.scorebookText]}>
              Scorebook
            </Text>
          </Pressable>
        </View>
        {/* View Stats Button (only if fixtures exist) */}
        {fixtures.length > 0 && (
          <Pressable
            style={styles.statsButton}
            onPress={() => {
              closeStartModal(); // 👈 THIS is what you're missing
              router.push("/stats");
            }}
          >
            <Text style={styles.statsButtonText}>View Stats</Text>
          </Pressable>
        )}
        <Pressable style={styles.devButton} onPress={clearAllFixtures}>
          <Text style={styles.devButtonText}>DEV: Clear All Fixtures</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    padding: 20,
  },

  // Header styles
  header: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 20,
  },
  headerLogo: {
    width: 240,
    height: undefined,
    aspectRatio: 1.8,
    marginBottom: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "600",
  },

  // Card buttons
  card: {
    width: "100%",
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardLogo: {
    width: 180,
    height: undefined,
    aspectRatio: 1.8,
    marginBottom: 2,
  },
  cardText: {
    fontSize: 38,
    fontWeight: "700",
  },
  ballCounter: {
    backgroundColor: "#12c2e9",
  },
  ballCounterText: {
    color: "#fff",
  },
  scorebook: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#12c2e9",
  },
  scorebookText: {
    color: "#12c2e9",
  },
  devButton: {
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ff3b30",
    alignItems: "center",
  },
  devButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  statsButton: {
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#0a84ff",
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
  },

  statsButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
});
