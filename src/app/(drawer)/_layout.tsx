// app/(drawer)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
  ActivityIndicator,
  ScrollView,
  Text,
  Pressable,
} from "react-native";
import { Stack } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useAuthModalStore } from "../../state/authModalStore";
import { resetGuestIfNeeded } from "../../utils/authHelpers";
import { useTenantConfig } from "../../hooks/useTenantConfig";
import { APP_LOGOS } from "../../constants/Assets";
import { useExitGame } from "../../hooks/useExitGame";
import { useStartModalGate } from "../../hooks/useStartModalGate";
import StartModeModal from "../../components/StartModal/StartModeModal";
import { usePlusAction } from "../../hooks/usePlusAction";
import QuickSettingsModal from "@/components/Scorebook/QuickSettingsModal";

Sentry.init({
  dsn: "https://90fc5ebafc7873a966be3afaaa4dd223@o4509504906067968.ingest.us.sentry.io/4509504906264576", // 👈 Put the DSN string provided by the wizard here
  debug: __DEV__,
  tracesSampleRate: 1.0,
});

function DrawerLayout() {
  const { theme } = useTenantConfig();
  useStartModalGate();

  // Consolidate logic into a single source-of-truth lifecycle tracking block
  useEffect(() => {
    // 1. Instantly tag your application variant on mount / config adjustments
    const currentVariant =
      theme.headerLogo === "logo_littlewicket" ? "littlewicket" : "umpire";
    Sentry.setTag("app_variant", currentVariant);

    // 2. Manage a single global listener reference for the lifecycle of this block
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Firebase session restored:", user.uid);

        // Using ?. ensures that if the store instance is resolving, it won't crash the engine
        useAuthModalStore.getState().setUser?.(user);
        Sentry.setUser({ id: user.uid });
      } else {
        console.log("👤 No logged in user");

        useAuthModalStore.getState().setUser?.(null);
        Sentry.setUser(null);
      }
    });

    return unsub;
  }, [theme.headerLogo]); // Safely track and update when the theme configuration resolves

  return (
    <>
      <StartModeModal />
      {Platform.OS === "android" ? (
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <DrawerContent />
          </View>
        </SafeAreaProvider>
      ) : (
        <View style={{ flex: 1 }}>
          <DrawerContent />
        </View>
      )}
    </>
  );
}

function DrawerContent() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isGuest = useAuthStore((s) => s.isGuest);

  const [modalVisible, setModalVisible] = useState(false);
  const selectedMode = useStartModalStore((state) => state.selectedMode);

  // Pull the mode to determine the label/icon
  //const selectedMode = useStartModalStore((s) => s.selectedMode);

  // Get config from your hook
  const { theme } = useTenantConfig();

  // Use the same lookup logic from your Modal
  const logoSource = APP_LOGOS[theme.headerLogo];

  // To keep your specific styling logic for LittleWicket:
  const isLittleWicket = theme.headerLogo === "logo_littlewicket";

  /*
  const variant = Constants.expoConfig?.extra?.variant;
  const isLittleWicket = variant === "littlewicket";

  const logoSource = isLittleWicket
    ? require("../../../assets/LittleWicket-logo-small-white-bg.png")
    : require("../../../assets/4dot6logo-transparent.png");
    */

  //const { handleExitNoSave } = useExitGame();
  const { handleExitNoSave, isExiting } = useExitGame();

  // Define your visible routes in order with their precise titles and vector icons
  const drawerItems = [
    {
      name: "index",
      title: selectedMode === "scorebook" ? "Scorebook" : "Ball Counter",
      icon:
        selectedMode === "scorebook"
          ? "book-outline"
          : ("calculator-outline" as const),
    },
    {
      name: "account",
      title: isGuest ? "Login / Signup" : "Account",
      icon: isGuest ? "log-in-outline" : ("person-outline" as const),
    },
    {
      name: "upgrade",
      title: "Upgrade to Pro",
      icon: "card-outline" as const,
    },
  ];

  const hiddenRoutes = [
    "ball-counter",
    "fixtureList",
    "stats",
    "match-summary",
    "fixture-scorecard",
    "scorebook",
    "scorebook/indexScorebook",
    "scorebook/index",
    "live-scoring-fixtures",
    "live-scoring-home",
    "live-scoring-info",
    "live-scoring-instructions",
  ];

  return (
    <>
      <Drawer
        drawerContent={(props) => {
          // Match active navigation history tracking using the state key pointer
          const currentActiveRouteName =
            props.state.routes[props.state.index]?.name;

          return (
            <ScrollView
              style={[
                styles.customDrawer,
                { backgroundColor: isDark ? "#121212" : "#fff" },
              ]}
              contentContainerStyle={{
                paddingBottom: 30,
              }}
            >
              {/* 1. Dynamic Map of Filtered Drawer Items */}
              <View style={styles.itemsContainer}>
                {drawerItems
                  .filter((item) => !hiddenRoutes.includes(item.name))
                  .map((item) => {
                    const isActive = currentActiveRouteName === item.name;

                    return (
                      <Pressable
                        key={item.name}
                        onPress={() => router.push(`/(drawer)/${item.name}`)}
                        style={[
                          styles.customDrawerItem,
                          {
                            backgroundColor: isActive
                              ? "rgba(255, 112, 67, 0.1)"
                              : "transparent",
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={
                            isActive ? "#FF7043" : isDark ? "#ccc" : "#333"
                          }
                        />
                        <Text
                          style={[
                            styles.customItemLabel,
                            {
                              color: isActive
                                ? "#FF7043"
                                : isDark
                                  ? "#ccc"
                                  : "#333",
                              fontWeight: isActive ? "600" : "400",
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>

              {/* 2. Custom Action Button for Match Exiting */}
              <Pressable
                onPress={() => {
                  if (!isExiting) handleExitNoSave();
                }}
                style={[
                  styles.customDrawerItem,
                  {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark ? "#333" : "#eee",
                    paddingTop: 15,
                  },
                ]}
              >
                {isExiting ? (
                  <ActivityIndicator size={22} color="#ff4444" />
                ) : (
                  <Ionicons name="exit-outline" size={22} color="#ff4444" />
                )}
                <Text
                  style={[
                    styles.customItemLabel,
                    { color: "#ff4444", fontWeight: "500" },
                  ]}
                >
                  {isExiting ? "Exiting..." : "Exit Game (no save)"}
                </Text>
              </Pressable>
            </ScrollView>
          );
        }}
        screenOptions={{
          headerShown: true,

          // Keeps your exact original logo layout intact
          headerTitle: () => (
            <View
              style={[
                styles.logoContainer,
                {
                  //backgroundColor: isLittleWicket ? "#fff" : "transparent",
                  //borderRadius: isLittleWicket ? 50 : 0,
                  //paddingHorizontal: isLittleWicket ? 10 : 0,
                  //paddingVertical: isLittleWicket ? 5 : 0,
                  //marginBottom: isLittleWicket ? 5 : 0,
                },
              ]}
            >
              <Image
                source={logoSource}
                style={[
                  styles.logo,
                  {
                    width: isLittleWicket ? 200 : 120,
                    aspectRatio: theme.logoAspectRatio,
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          ),

          // Shifts layout close to the left menu button
          headerTitleAlign: "left",

          headerStyle: {
            backgroundColor: "#0b1326", // Updated background to bg-surface (#0b1326)
            shadowOpacity: 0,
            shadowColor: "transparent",
            elevation: 0,
          },

          // Updated brand accent color tint to text-primary (#7fdaff)
          headerTintColor: "#7fdaff",

          // Adds the requested settings icon to the right side of the header
          headerRight: () => (
            <Pressable
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                styles.headerRightButton,
                {
                  backgroundColor: pressed
                    ? "rgba(45, 52, 73, 0.5)"
                    : "transparent",
                },
              ]}
            >
              <Ionicons name="settings-outline" size={22} color="#7fdaff" />
            </Pressable>
          ),

          drawerStyle: {
            backgroundColor: isDark ? "#121212" : "#fff",
          },
        }}
      />
      <QuickSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    // Shifted alignment rules to hug the left side icon closely
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: -8, // Negative margin pulls title closer to menu button
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRightButton: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 16, // px-container-padding-mobile right buffer
    alignItems: "center",
    justifyContent: "center",
  },
  customDrawer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 100 : 60,
  },
  itemsContainer: {
    paddingVertical: 1,
  },
  customDrawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginVertical: 4,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  customItemLabel: {
    marginLeft: 24,
    fontSize: 15,
  },
});

export default Sentry.wrap(DrawerLayout);
