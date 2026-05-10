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

  const handleExitNoSave = () => {
    // 1. Get store instances
    const startModalStore = useStartModalStore.getState();
    const gameStore = useGameStore.getState();

    // 2. Perform all standard cleanup first
    resetGuestIfNeeded();
    useFixtureStore.getState().saveCurrentInnings();
    useFixtureStore.setState({ currentFixture: undefined });
    useMatchStore.getState().resetInnings();

    gameStore.resetGame();
    gameStore.resetBatters();
    gameStore.setSetupComplete(false);
    gameStore.triggerSetup();

    // 3. 🔑 THE FIX: Sequence the state before navigating
    // First: Clear the selected mode so Index doesn't auto-redirect
    startModalStore.reset();

    // Second: Force the modal to an open state
    startModalStore.open();

    // Third: Delay navigation slightly to ensure Zustand/Storage has committed
    setTimeout(() => {
      router.replace("/");
    }, 0);
  };

  const hiddenRoutes = [
    "ball-counter",
    "fixtureList",
    "stats",
    "match-summary",
    "fixture-scorecard",
    "scorebook",
    "scorebook/indexScorebook",
    "scorebook/index",
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
              label="Exit Game (no save)"
              labelStyle={{ color: "#ff4444" }} // Red to indicate a destructive action
              icon={({ size }) => (
                <Ionicons name="exit-outline" size={size} color="#ff4444" />
              )}
              onPress={handleExitNoSave}
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
