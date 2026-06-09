// app/(drawer)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
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
import { resetGuestIfNeeded } from "../../utils/authHelpers";
import { useTenantConfig } from "../../hooks/useTenantConfig";
import { APP_LOGOS } from "../../constants/Assets";
import { useExitGame } from "../../hooks/useExitGame";
import { useStartModalGate } from "../../hooks/useStartModalGate";
import StartModeModal from "../../components/StartModal/StartModeModal";

Sentry.init({
  dsn: "https://90fc5ebafc7873a966be3afaaa4dd223@o4509504906067968.ingest.us.sentry.io/4509504906264576", // 👈 Put the DSN string provided by the wizard here
  debug: __DEV__,
  tracesSampleRate: 1.0,
});

//  To this:
function DrawerLayout() {
  const { theme } = useTenantConfig();
  useStartModalGate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Firebase session restored:", user.uid);
      } else {
        console.log("👤 No logged in user");
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    // 1. Tag the variant based on your existing theme hook
    const currentVariant =
      theme.headerLogo === "logo_littlewicket" ? "littlewicket" : "umpire";

    Sentry.setTag("app_variant", currentVariant);

    // 2. Keep your existing Firebase auth listener
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Firebase session restored:", user.uid);
        // Optional: Associate the crash with a user ID (GDPR compliant)
        Sentry.setUser({ id: user.uid });
      } else {
        console.log("👤 No logged in user");
        Sentry.setUser(null); // Clear user on logout
      }
    });

    return unsub;
  }, [theme.headerLogo]); // Run when theme logo changes

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

  // Pull the mode to determine the label/icon
  const selectedMode = useStartModalStore((s) => s.selectedMode);

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
              flexGrow: 1,
              justifyContent: "space-between",
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
                        color={isActive ? "#FF7043" : isDark ? "#ccc" : "#333"}
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
                  marginTop: "auto",
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: isDark ? "#333" : "#eee",
                  pt: 15,
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

        headerTitle: () => (
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: isLittleWicket ? "#fff" : "transparent",
                borderRadius: isLittleWicket ? 50 : 0,
                paddingHorizontal: isLittleWicket ? 10 : 0,
                paddingVertical: isLittleWicket ? 5 : 0,
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

        headerTitleAlign: "center",

        headerStyle: {
          backgroundColor: "#12c2e9",
          shadowOpacity: 0,
          shadowColor: "transparent",
          elevation: 0,
        },

        headerTintColor: "#000",

        drawerStyle: {
          backgroundColor: isDark ? "#121212" : "#fff",
        },
      }}
    />
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 40,
  },
  customDrawer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  itemsContainer: {
    paddingVertical: 10,
  },
  customDrawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  customItemLabel: {
    marginLeft: 24,
    fontSize: 15,
  },
});

export default Sentry.wrap(DrawerLayout);
