import Constants from "expo-constants";
import { router, Href } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { shallow } from "zustand/shallow";
import { useAuthModalStore } from "../../state/authModalStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useJuniorPromptStore } from "../../state/juniorPromptStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useTenantConfig } from "../../hooks/useTenantConfig";
import { APP_LOGOS } from "../../constants/Assets";
import { useLiveStore } from "@/src/state/liveStore";

type AppLogoKey = keyof typeof APP_LOGOS;

export default function StartModeModal() {
  const isOpen = useStartModalStore((s) => s.isOpen);
  const selectedMode = useStartModalStore((s) => s.selectedMode);
  const selectBallCounter = useStartModalStore((s) => s.selectBallCounter);
  const selectScorebook = useStartModalStore((s) => s.selectScorebook);
  const closeStartModal = useStartModalStore((s) => s.close);
  const authModalOpen = useAuthModalStore((s) => s.isOpen);
  const openAuthModal = useAuthModalStore((s) => s.open);
  const hasSeenPrompt = useJuniorPromptStore((s) => s.hasSeenPrompt);
  const setHasSeenPrompt = useJuniorPromptStore((s) => s.setHasSeenPrompt);
  const { teamCodesSupporter } = useLiveStore.getState();
  const setReadOnly = useLiveStore.getState().setReadOnly;

  const [pendingAction, setPendingAction] = useState(null);

  const clearAllFixtures = useFixtureStore((s) => s.clearAllFixtures);
  const fixtures = useFixtureStore((s) => s.fixtures, shallow);

  //const variant = Constants.expoConfig?.extra?.variant;
  const { theme, features, modes } = useTenantConfig();
  // Sort modes: Put the 'primary' mode first based on the config data
  const sortedModes = [...modes].sort((a, b) => {
    return Number(b.primary) - Number(a.primary);
  });
  console.log("DEBUG - sortedModes:", sortedModes);

  const logoSource = APP_LOGOS[theme.headerLogo as keyof typeof APP_LOGOS];
  const bgKey = theme.backgroundImage as keyof typeof APP_LOGOS | null;

  //const cardLogo = APP_LOGOS[mode.logo as keyof typeof APP_LOGOS];

  const bgSource = bgKey ? APP_LOGOS[bgKey] : null;
  //const isLittleWicket = variant === "littlewicket";

  // Force re-render whenever store updates (helps with hydration & reset)
  /*
  const [, setTick] = useState(0);
  useEffect(() => {
    // Subscribe to store changes
    const unsub = useStartModalStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);
  */

  const handleStart = (type) => {
    if (!hasSeenPrompt && features.showJuniorPrompt) {
      setPendingAction(type);

      Alert.alert(
        "Are you using this for junior cricket?",
        "If so, we recommend downloading LittleWicket, designed specifically for modified junior and youth cricket rules.",
        [
          {
            text: "Download LittleWicket",
            onPress: () => handleJuniorChoice("download"),
          },
          {
            text: "Continue with 4dot6",
            onPress: () => handleJuniorChoice("continue"),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );

      return;
    }

    if (type === "ball") onBallCounter();
    if (type === "score") onScorebook();
    if (type === "liveScores") onLiveScore();
  };

  const IOS_URL =
    "https://apps.apple.com/us/app/littlewicket-cricket-scorebook/id1571914530";
  const ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.cricketscorebookbyc";

  const handleJuniorChoice = async (choice) => {
    setHasSeenPrompt(true);

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
      if (pendingAction === "liveScores") onLiveScore();
    }
  };

  const navigateToGameMode = (
    selectModeFn: (() => void) | null, // A function with no args/return, or null
    route: Href, // The path string
    shouldTriggerSetup: boolean = true, // Optional boolean with default
  ) => {
    closeStartModal();

    if (selectModeFn) selectModeFn();

    if (shouldTriggerSetup) {
      const game = useGameStore.getState();
      game.triggerSetup();
    }

    router.replace(route);

    setTimeout(() => {
      router.replace(route);
    }, 100);
  };

  const destination =
    teamCodesSupporter.length > 0
      ? "/live-scoring-fixtures"
      : "/live-scoring-home";

  // Usage:
  /*
  const onBallCounter = () =>
    navigateToGameMode(selectBallCounter, "/ball-counter");
  const onScorebook = () => navigateToGameMode(selectScorebook, "/scorebook");
  const onLiveScore = () => navigateToGameMode(null, destination, false);
  */

  const onBallCounter = () => {
    setReadOnly(false); // Enable features
    navigateToGameMode(selectBallCounter, "/ball-counter");
  };

  const onScorebook = () => {
    setReadOnly(false); // Enable features
    navigateToGameMode(selectScorebook, "/scorebook");
  };

  const onLiveScore = () => {
    setReadOnly(true); // Disable features / Read-only mode
    navigateToGameMode(null, destination, false);
  };

  return (
    <>
      <Modal
        visible={isOpen && selectedMode === null && !authModalOpen}
        animationType="fade"
        transparent
      >
        <View
          style={[styles.overlay, { backgroundColor: theme.modeSelectionBg }]}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            {/* FULL SCREEN BACKGROUND WRAPPER */}
            <ImageBackground
              source={bgSource}
              style={styles.bg}
              imageStyle={styles.backgroundImage}
            >
              {/* CONTENT OVERLAY */}
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View
                  style={[
                    styles.header,
                    { backgroundColor: theme.modeHeaderBg },
                  ]}
                >
                  <Image
                    source={logoSource}
                    style={[
                      styles.headerLogo,
                      { aspectRatio: theme.logoAspectRatio },
                    ]}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.headerText,
                      { color: theme.headerTextColor },
                    ]}
                  >
                    Select your mode
                  </Text>
                </View>

                {/* Modes */}
                {sortedModes.map((mode, index) => {
                  const cardLogo =
                    APP_LOGOS[mode.logo as keyof typeof APP_LOGOS];
                  const bg = theme[`${mode.id}Bg`] ?? theme.cardBg;
                  const border =
                    theme[`${mode.id}BorderColor`] ?? theme.cardBorderColor;
                  const text =
                    theme[`${mode.id}Text`] ??
                    theme[`${mode.id}TextColor`] ??
                    theme.cardTextColor;

                  return (
                    <Animated.View
                      key={mode.id}
                      entering={FadeInDown.duration(400).delay(index * 100)}
                    >
                      <Card
                        mode="contained"
                        style={[
                          styles.paperCard,
                          {
                            backgroundColor: bg,
                            borderColor: border,
                            borderWidth: theme.cardBorderWidth ?? 2,
                          },
                        ]}
                        onPress={() => handleStart(mode.id)}
                      >
                        <Card.Content style={styles.cardContent}>
                          <Image
                            source={cardLogo}
                            style={styles.cardLogo}
                            resizeMode="contain"
                          />
                          <Text style={[styles.cardText, { color: text }]}>
                            {mode.label}
                          </Text>
                        </Card.Content>
                      </Card>
                    </Animated.View>
                  );
                })}

                {/* Stats */}
                {fixtures.length > 0 && (
                  <Button
                    mode="contained"
                    rippleColor="rgba(255, 255, 255, 0.4)"
                    icon="chart-bar" // Perfect material icon for statistics
                    style={styles.statsButton}
                    labelStyle={styles.statsButtonText}
                    onPress={() => {
                      closeStartModal();
                      router.push("/stats");
                    }}
                  >
                    View Stats
                  </Button>
                )}

                {/* Fixtures */}
                {fixtures.length > 0 && (
                  <Button
                    mode="contained"
                    rippleColor="rgba(255, 255, 255, 0.4)"
                    icon="calendar-text" // Standard material icon for schedules/fixtures
                    style={styles.statsButton}
                    labelStyle={styles.statsButtonText}
                    onPress={() => {
                      closeStartModal();
                      router.push("/fixtureList");
                    }}
                  >
                    View Fixtures Results
                  </Button>
                )}

                {/* Login */}
                <Button
                  mode="contained"
                  icon="login"
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonText}
                  onPress={openAuthModal}
                >
                  Login / Sign Up
                </Button>
              </ScrollView>
            </ImageBackground>
          </SafeAreaView>
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
    borderRadius: 12,
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
  /*
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
  */
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
    borderRadius: 12,
    backgroundColor: "#af52de",
    width: "100%",
    alignSelf: "center",
    // Remove paddingVertical: 18 from here
  },

  statsButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 6, // Controls the inner height beautifully
  },

  loginButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#fff",
    width: "100%",
    alignSelf: "center",
    // Remove paddingVertical: 14 from here!
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingVertical: 4, // Control your height via the text padding instead
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    width: "100%",
    paddingTop: 60,
    paddingBottom: 20,
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
    borderRadius: 12,
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
    borderRadius: 12,
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
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  paperCard: {
    width: "100%",
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden", // Ensures the ripple effect stays inside the rounded corners
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
});

/*
<Pressable style={styles.devButton} onPress={clearAllFixtures}>
              <Text style={styles.devButtonText}>DEV: Clear All Fixtures</Text>
            </Pressable>
            */
