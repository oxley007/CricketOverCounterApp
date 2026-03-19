import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AuthModal from "../../components/AuthModal";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useStartModalStore } from "../../state/startModalStore";

export default function StartModeModal() {
  const isOpen = useStartModalStore((s) => s.isOpen);
  const selectBallCounter = useStartModalStore((s) => s.selectBallCounter);
  const selectScorebook = useStartModalStore((s) => s.selectScorebook);
  const closeStartModal = useStartModalStore((s) => s.close);
  const [authVisible, setAuthVisible] = useState(false);

  const clearAllFixtures = useFixtureStore((s) => s.clearAllFixtures);
  const fixtures = useFixtureStore((s) => s.fixtures);

  // Force re-render whenever store updates (helps with hydration & reset)
  const [, setTick] = useState(0);
  useEffect(() => {
    // Subscribe to store changes
    const unsub = useStartModalStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const onBallCounter = () => {
    closeStartModal();
    selectBallCounter();

    const game = useGameStore.getState();
    game.triggerSetup();

    setTimeout(() => {
      router.replace("/ball-counter");
    }, 100);
  };

  const onScorebook = () => {
    closeStartModal();
    selectScorebook();

    const game = useGameStore.getState();
    game.triggerSetup();

    setTimeout(() => {
      router.replace("/scorebook");
    }, 100);
  };

  return (
    <>
      <Modal visible={isOpen && !authVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
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
            {/* View Fixtures Button (only if fixtures exist) */}
            {fixtures.length > 0 && (
              <Pressable
                style={styles.statsButton}
                onPress={() => {
                  closeStartModal();
                  router.push("/fixtureList");
                }}
              >
                <Text style={styles.statsButtonText}>
                  View Fixtures Results
                </Text>
              </Pressable>
            )}
            <Pressable
              style={styles.loginButton}
              onPress={() => {
                setAuthVisible(true); // show AuthModal
              }}
            >
              <Text style={styles.loginButtonText}>Login / Sign Up</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
      <AuthModal
        visible={authVisible}
        onClose={() => {
          setAuthVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  // Header styles
  header: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 16,
    alignItems: "center",
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
  loginButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  container: {
    width: "90%",
    alignSelf: "center",
  },

  card: {
    width: "100%", // full width of container
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
    width: "90%", // responsive width
    height: undefined,
    aspectRatio: 3.2,
    marginBottom: 12,
    alignSelf: "center",
  },
});

/*
<Pressable style={styles.devButton} onPress={clearAllFixtures}>
              <Text style={styles.devButtonText}>DEV: Clear All Fixtures</Text>
            </Pressable>
            */
