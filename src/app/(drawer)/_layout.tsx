// app/(drawer)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerToggleButton,
} from "@react-navigation/drawer";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isGuest = useAuthStore((s) => s.isGuest);

  const hiddenRoutes = [
    "index",
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
          </DrawerContentScrollView>
        );
      }}
      screenOptions={{
        headerShown: true,

        headerTitle: () => (
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/4dot6logo-transparent.png")}
              style={styles.logo}
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
        name="upgrade"
        options={{
          title: "Upgrade to Pro",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
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
