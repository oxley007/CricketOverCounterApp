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
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { shallow } from "zustand/shallow";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuthModalStore } from "../../state/authModalStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useJuniorPromptStore } from "../../state/juniorPromptStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useTenantConfig } from "../../hooks/useTenantConfig";
import { APP_LOGOS } from "../../constants/Assets";
import { useLiveStore } from "@/src/state/liveStore";
import { SVG_ASSETS } from "@/src/constants/Assets";
import Cricket from "../../assets/svg/cricket.svg";

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

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const clearAllFixtures = useFixtureStore((s) => s.clearAllFixtures);
  const fixtures = useFixtureStore((s) => s.fixtures, shallow);

  const { theme, modes, features, branding } = useTenantConfig();
  const Watermark = SVG_ASSETS.cricket;

  const sortedModes = [...modes].sort((a, b) => {
    return Number(b.primary) - Number(a.primary);
  });

  const logoSource = APP_LOGOS[theme.headerLogo as keyof typeof APP_LOGOS];
  const bgKey = theme.backgroundImage as keyof typeof APP_LOGOS | null;
  const bgSource = bgKey ? APP_LOGOS[bgKey] : null;

  const handleStart = (type: string) => {
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

  const IOS_URL = "https://apple.com";
  const ANDROID_URL = "https://google.com";

  const handleJuniorChoice = async (choice: "download" | "continue") => {
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
    selectModeFn: (() => void) | null,
    route: Href,
    shouldTriggerSetup: boolean = true,
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

  const onBallCounter = () => {
    setReadOnly(false);
    navigateToGameMode(selectBallCounter, "/ball-counter");
  };

  const onScorebook = () => {
    setReadOnly(false);
    navigateToGameMode(selectScorebook, "/scorebook");
  };

  const onLiveScore = () => {
    setReadOnly(true);
    navigateToGameMode(null, destination, false);
  };

  const getCardStyles = (modeId: string) => {
    switch (modeId) {
      case "ball":
        return {
          gradient: ["#00c2f3", "#5fd4ff"],
          text: "#003545",
          labelBg: "rgba(255, 255, 255, 0.2)",
          icon: "sports-cricket",
          badgeText: "Umpire Ball & Over Counter",
          actionIcon: "arrow-forward",
          actionIconBg: "#004c61",
          actionIconColor: "#00c2f3",
        };
      case "score":
        return {
          gradient: ["#ffffff", "#ffffff"],
          text: "#004c61",
          labelBg: "rgba(95, 212, 255, 0.1)",
          icon: "menu-book",
          badgeText: "Full Cricket Scorebook mode",
          actionIcon: "edit-note",
          actionIconBg: "#004c61",
          actionIconColor: "#ffffff",
        };
      case "liveScores":
      default:
        return {
          gradient: ["#004d63", "#00c2f3"],
          text: "#ffffff",
          labelBg: "rgba(255,255,255,0.0)",
          icon: "sensors",
          badgeText: "",
          actionIcon: "sensors",
          actionIconBg: "#ffffff",
          actionIconColor: "#00c2f3",
        };
    }
  };

  return (
    <Modal
      visible={isOpen && selectedMode === null && !authModalOpen}
      animationType="fade"
      transparent
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.modeSelectionBg || "#0b1326" },
        ]}
      >
        <SafeAreaView
          style={{ flex: 1, width: "100%" }}
          edges={["top", "bottom"]}
        >
          <ImageBackground
            source={bgSource}
            style={styles.bg}
            imageStyle={styles.backgroundImage}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Layout Block */}
              <View
                style={[
                  styles.header,
                  {
                    backgroundColor: theme.modeHeaderBg,
                  },
                ]}
              >
                <Image
                  source={logoSource}
                  style={[
                    styles.headerLogo,
                    {
                      aspectRatio: theme.logoAspectRatio,
                    },
                  ]}
                  resizeMode="contain"
                />

                <Text
                  style={[
                    styles.headlineTitle,
                    {
                      color: theme.headerTextColor,
                    },
                  ]}
                >
                  Select your mode
                </Text>

                <Text
                  style={[
                    styles.headlineSubtitle,
                    {
                      color:
                        theme.headerTextColor === "#ffffff"
                          ? "#ffffff"
                          : "#ffffff",
                    },
                  ]}
                >
                  Choose your mode below to start tracking your match.
                </Text>
              </View>

              {/* Bento Grid Dynamic Cards */}
              <View style={styles.gridContainer}>
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

                  const isLightCard =
                    bg === "#fff" || bg === "#ffffff" || bg === "#FFFFFF";

                  const watermarkSource = theme.scoreWatermark
                    ? APP_LOGOS[theme.scoreWatermark as keyof typeof APP_LOGOS]
                    : null;

                  return (
                    <Animated.View
                      key={mode.id}
                      entering={FadeInDown.duration(400).delay(index * 100)}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.bentoCard,
                          {
                            backgroundColor: bg,
                            borderColor: border,
                            borderWidth: theme.cardBorderWidth ?? 0,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                        ]}
                        onPress={() => handleStart(mode.id)}
                      >
                        {/* Watermark */}
                        <View
                          style={styles.watermarkContainer}
                          pointerEvents="none"
                        >
                          {Watermark && <Watermark width={180} height={180} />}
                        </View>

                        {/* Top */}
                        <View style={styles.cardTop}>
                          <Text style={[styles.cardBrand, { color: text }]}>
                            {branding.shortName}
                          </Text>

                          <View
                            style={[
                              styles.cardBadge,
                              {
                                backgroundColor: isLightCard
                                  ? "rgba(18,194,233,0.12)"
                                  : "rgba(255,255,255,0.12)",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cardBadgeText,
                                {
                                  color: text,
                                },
                              ]}
                            >
                              {mode.id === "ball"
                                ? "Umpire Ball & Over Counter"
                                : mode.id === "score"
                                  ? "Full Cricket Scorebook mode"
                                  : "Live Match Streaming for Supporters"}
                            </Text>
                          </View>
                        </View>

                        {/* Bottom */}
                        <View style={styles.cardBottom}>
                          <Text
                            style={[
                              styles.cardTitle,
                              {
                                color: text,
                              },
                            ]}
                          >
                            {mode.label}
                          </Text>

                          <View
                            style={[
                              styles.cardAction,
                              {
                                backgroundColor: isLightCard
                                  ? theme.cardBg
                                  : "#ffffff",
                              },
                            ]}
                          >
                            <MaterialIcons
                              name={
                                mode.id === "ball"
                                  ? "sports-cricket"
                                  : mode.id === "score"
                                    ? "edit-note"
                                    : "sensors"
                              }
                              size={20}
                              color={isLightCard ? "#fff" : bg}
                            />
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Secondary Utility Controls */}
              <View style={styles.secondarySection}>
                <Text
                  style={[
                    styles.sectionDividerText,
                    {
                      color: theme.headerTextColor,
                      opacity: 0.7,
                    },
                  ]}
                >
                  ANALYTICS & MORE
                </Text>

                <View style={styles.actionGridRow}>
                  <Button
                    mode="contained"
                    style={[
                      styles.utilityGridButton,
                      {
                        backgroundColor: theme.cardBg,
                      },
                    ]}
                    labelStyle={[
                      styles.utilityButtonText,
                      {
                        color: theme.cardTextColor,
                      },
                    ]}
                    onPress={() => {
                      closeStartModal();
                      router.push("/stats");
                    }}
                  >
                    View Stats
                  </Button>

                  <Button
                    mode="contained"
                    style={[
                      styles.utilityGridButton,
                      {
                        backgroundColor: theme.cardBg,
                      },
                    ]}
                    labelStyle={[
                      styles.utilityButtonText,
                      {
                        color: theme.cardTextColor,
                      },
                    ]}
                    onPress={() => {
                      closeStartModal();
                      router.push("/fixtureList");
                    }}
                  >
                    View Fixtures
                  </Button>
                </View>

                <Button
                  mode="outlined"
                  style={[
                    styles.loginButton,
                    {
                      borderColor: theme.cardBg,
                    },
                  ]}
                  labelStyle={[
                    styles.loginButtonText,
                    {
                      color: theme.cardBg,
                    },
                  ]}
                  onPress={openAuthModal}
                >
                  Login / Sign Up
                </Button>
              </View>
            </ScrollView>
          </ImageBackground>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: "100%",
  },

  bg: {
    flex: 1,
    width: "100%",
  },

  backgroundImage: {
    resizeMode: "cover",
    opacity: 0.05,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },

  /* ================= HEADER ================= */

  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 12,
  },

  headerLogo: {
    width: 240,
    marginTop: 20,
    height: undefined,
    marginBottom: 0,
    textAlign: "left",
    alignSelf: "flex-start",
  },

  headlineTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "left",
    alignSelf: "flex-start", // 👈 Forces the text bounding box to align left
  },

  headlineSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },

  /* ================= GRID ================= */

  gridContainer: {
    gap: 16,
    width: "100%",
  },

  /* ================= BENTO CARD ================= */

  bentoCard: {
    width: "100%",
    height: 192,
    borderRadius: 16,
    padding: 24,
    justifyContent: "space-between",
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  watermarkContainer: {
    position: "absolute",
    right: -20,
    bottom: 30,

    opacity: 0.12,

    zIndex: 0,
  },

  watermarkLogo: {
    width: 180,
    height: 180,
  },

  /* ================= CARD TOP ================= */

  cardTop: {
    gap: 8,
    zIndex: 1,
  },

  cardBrand: {
    fontSize: 22,
    fontWeight: "700",
  },

  cardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  cardBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* ================= CARD BOTTOM ================= */

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  cardAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ================= UTILITIES ================= */

  secondarySection: {
    marginTop: 24,
    width: "100%",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionDividerText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 15,
  },

  hairlineDivider: {
    flex: 1,
    height: 1,
    marginLeft: 16,
    opacity: 0.2,
  },

  actionGridRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },

  utilityGridButton: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    borderRadius: 12,
  },

  loginButton: {
    width: "100%",
    height: 52,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },

  loginButtonText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
});
