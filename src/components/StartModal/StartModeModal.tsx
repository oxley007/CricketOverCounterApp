import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthModal from "../../components/AuthModal";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useJuniorPromptStore } from "../../state/juniorPromptStore";
import { useStartModalStore } from "../../state/startModalStore";

export default function StartModeModal() {
  const isOpen = useStartModalStore((s) => s.isOpen);
  const selectBallCounter = useStartModalStore((s) => s.selectBallCounter);
  const selectScorebook = useStartModalStore((s) => s.selectScorebook);
  const closeStartModal = useStartModalStore((s) => s.close);
  const [authVisible, setAuthVisible] = useState(false);
  const hasSeenPrompt = useJuniorPromptStore((s) => s.hasSeenPrompt);
  const setHasSeenPrompt = useJuniorPromptStore((s) => s.setHasSeenPrompt);

  const [showJuniorPrompt, setShowJuniorPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const clearAllFixtures = useFixtureStore((s) => s.clearAllFixtures);
  const fixtures = useFixtureStore((s) => s.fixtures);

  const variant = Constants.expoConfig?.extra?.variant;
  console.log("DEBUG - App Variant:", variant);
  const isLittleWicket = variant === "littlewicket";

  // Map your images
  const images = {
    headerLogo: isLittleWicket
      ? require("../../../assets/LittleWicket-logo-small.png")
      : require("../../../assets/4dot6logo-transparent.png"),

    ballCounterCard: isLittleWicket
      ? require("../../../assets/LittleWicket-logo-small.png")
      : require("../../../assets/4dot6logo-transparent.png"),
  };

  // Force re-render whenever store updates (helps with hydration & reset)
  const [, setTick] = useState(0);
  useEffect(() => {
    // Subscribe to store changes
    const unsub = useStartModalStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const handleStart = (type) => {
    if (!hasSeenPrompt && !isLittleWicket) {
      setPendingAction(type);
      setShowJuniorPrompt(true);
      return;
    }

    if (type === "ball") onBallCounter();
    if (type === "score") onScorebook();
  };

  const IOS_URL =
    "https://apps.apple.com/us/app/littlewicket-cricket-scorebook/id1571914530";
  const ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.cricketscorebookbyc";

  const handleJuniorChoice = async (choice) => {
    setHasSeenPrompt(true);
    setShowJuniorPrompt(false);

    if (choice === "download") {
      const url = Platform.OS === "ios" ? IOS_URL : ANDROID_URL;

      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.log("Can't open URL:", url);
        }
      } catch (err) {
        console.log("Error opening store:", err);
      }

      return;
    }

    if (choice === "continue") {
      if (pendingAction === "ball") onBallCounter();
      if (pendingAction === "score") onScorebook();
    }
  };

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
        <View
          style={[
            styles.overlay,
            { backgroundColor: isLittleWicket ? "#fff" : "rgba(0,0,0,1)" },
          ]}
        >
          <SafeAreaView style={styles.safe}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <ImageBackground
                source={
                  isLittleWicket
                    ? require("../../../assets/ios-icon-littlewicket.png")
                    : null
                }
                style={styles.container}
                // This styles the actual image inside the container
                imageStyle={isLittleWicket ? styles.backgroundImage : {}}
              >
                {/* Header */}
                <View
                  style={[
                    styles.header,
                    {
                      backgroundColor: isLittleWicket
                        ? "transparent"
                        : "rgba(0,0,0,1)",
                    },
                  ]}
                >
                  <Image
                    source={images.headerLogo} // <--- Dynamic source
                    style={[
                      styles.headerLogo,
                      { aspectRatio: isLittleWicket ? 4.1 : 1.8 },
                    ]}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.headerText,
                      {
                        color: isLittleWicket ? "#000" : "rgba(255,255,255,1)",
                      },
                    ]}
                  >
                    Select your mode
                  </Text>
                </View>

                {/* DYNAMIC ORDERING STARTS HERE */}
                {isLittleWicket ? (
                  <>
                    {/* 1st: Scorebook */}
                    <Pressable
                      style={[styles.card, styles.scorebook]}
                      onPress={() => handleStart("score")}
                    >
                      <Image
                        source={images.ballCounterCard}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                      <Text style={[styles.cardText, styles.scorebookText]}>
                        Scorebook
                      </Text>
                    </Pressable>

                    {/* 2nd: Ball Counter */}
                    <Pressable
                      style={[
                        styles.card,
                        styles.ballCounter,
                        {
                          backgroundColor: isLittleWicket ? "#fff" : "#12c2e9",
                          borderColor: isLittleWicket
                            ? "#e9df36"
                            : "transparent",
                          borderWidth: isLittleWicket ? 2 : 0,
                        },
                      ]}
                      onPress={() => handleStart("ball")}
                    >
                      <Image
                        source={images.ballCounterCard}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.cardText,
                          styles.ballCounterText,
                          { color: isLittleWicket ? "#e9df36" : "#fff" },
                        ]}
                      >
                        Ball Counter
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* 1st: Ball Counter */}
                    <Pressable
                      style={[styles.card, styles.ballCounter]}
                      onPress={() => handleStart("ball")}
                    >
                      <Image
                        source={images.ballCounterCard}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                      <Text style={[styles.cardText, styles.ballCounterText]}>
                        Ball Counter
                      </Text>
                    </Pressable>

                    {/* 2nd: Scorebook */}
                    <Pressable
                      style={[styles.card, styles.scorebook]}
                      onPress={() => handleStart("score")}
                    >
                      <Image
                        source={images.ballCounterCard}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                      <Text style={[styles.cardText, styles.scorebookText]}>
                        Scorebook
                      </Text>
                    </Pressable>
                  </>
                )}
              </ImageBackground>
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
          </SafeAreaView>
        </View>
      </Modal>
      <AuthModal
        visible={authVisible}
        onClose={() => {
          setAuthVisible(false);
        }}
      />
      <Modal visible={showJuniorPrompt} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>
              Are you using this app for junior cricket?
            </Text>

            <Text style={styles.promptText}>
              If so, download our LittleWicket app built specifically for junior
              and youth cricket.
            </Text>

            <Pressable
              style={styles.downloadButton}
              onPress={() => handleJuniorChoice("download")}
            >
              <Text style={styles.downloadText}>Download LittleWicket</Text>
            </Pressable>

            <Pressable
              style={styles.continueButton}
              onPress={() => handleJuniorChoice("continue")}
            >
              <Text style={styles.continueText}>Continue with 4dot6</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    aspectRatio: 4,
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
    //width: "90%",
    alignSelf: "center",
    // Ensure the container has room for the image
    paddingBottom: 20,
    flex: 1, // Takes up all available height
    width: "100%", // Takes up all available width
    paddingTop: 60,
  },
  backgroundImage: {
    resizeMode: "cover",
    width: "100%",
    height: "100%",
    opacity: 0.1,
    position: "absolute",
    // No need for top/left 0 if width/height are 100% in an ImageBackground
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
  promptBox: {
    backgroundColor: "#fff",
    margin: 24,
    padding: 20,
    borderRadius: 16,
  },

  promptTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  promptText: {
    fontSize: 16,
    marginBottom: 20,
  },

  downloadButton: {
    backgroundColor: "#34c759",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  downloadText: {
    color: "#fff",
    fontWeight: "700",
  },

  continueButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },

  continueText: {
    fontWeight: "600",
  },
});

/*
<Pressable style={styles.devButton} onPress={clearAllFixtures}>
              <Text style={styles.devButtonText}>DEV: Clear All Fixtures</Text>
            </Pressable>
            */
