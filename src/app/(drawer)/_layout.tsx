// app/(drawer)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  DrawerToggleButton,
} from "@react-navigation/drawer";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
  ActivityIndicator,
} from "react-native";
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

export default function DrawerLayout() {
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

  return Platform.OS === "android" ? (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <DrawerContent />
      </View>
    </SafeAreaProvider>
  ) : (
    <View style={{ flex: 1 }}>
      <DrawerContent />
    </View>
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
        const filteredRoutes = props.state.routes.filter(
          (route) => !hiddenRoutes.includes(route.name),
        );

        const filteredRouteNames = filteredRoutes.map((r) => r.name);

        const filteredIndex = Math.max(
          0,
          filteredRoutes.findIndex(
            (r) => r.key === props.state.routes[props.state.index]?.key,
          ),
        );

        const filteredState = {
          ...props.state,
          routes: filteredRoutes,
          routeNames: filteredRouteNames,
          index: filteredIndex === -1 ? 0 : filteredIndex,
        };

        return (
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} state={filteredState} />

            <DrawerItem
              label={isExiting ? "Exiting..." : "Exit Game (no save)"}
              labelStyle={{ color: "#ff4444" }}
              icon={({ size }) =>
                isExiting ? (
                  <ActivityIndicator size={size} color="#ff4444" />
                ) : (
                  <Ionicons name="exit-outline" size={size} color="#ff4444" />
                )
              }
              // Short-circuit the press handler if already exiting
              onPress={() => {
                if (!isExiting) {
                  handleExitNoSave();
                }
              }}
            />
          </DrawerContentScrollView>
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
                  aspectRatio: theme.logoAspectRatio, // Use the ratio from config!
                },
              ]}
              resizeMode="contain"
            />
          </View>
        ),

        headerLeft: () => <DrawerToggleButton tintColor="#000" />,

        headerTitleAlign: "center",

        headerStyle: {
          backgroundColor: "#12c2e9",
          shadowOpacity: 0,
          shadowColor: "transparent",
          elevation: 0,
        },

        headerTintColor: "#000",

        drawerActiveTintColor: "#FF7043",
        drawerInactiveTintColor: isDark ? "#ccc" : "#333",

        drawerStyle: {
          backgroundColor: isDark ? "#121212" : "#fff",
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: selectedMode === "scorebook" ? "Scorebook" : "Ball Counter",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name={
                selectedMode === "scorebook"
                  ? "book-outline"
                  : "calculator-outline"
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="account"
        options={{
          title: isGuest ? "Login / Signup" : "Account",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name={isGuest ? "log-in-outline" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="upgrade"
        options={{
          title: "Upgrade to Pro",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
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
});
