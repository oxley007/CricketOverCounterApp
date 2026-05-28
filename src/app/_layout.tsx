import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { onAuthStateChanged } from "firebase/auth";
import {
  configureRevenueCat,
  isRevenueCatAvailable,
} from "../services/revenuecat";
import { syncUserData } from "../services/syncUserData";
import { useAuthStore } from "../state/authStore";
import { auth } from "./../services/firebaseConfig";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      if (isRevenueCatAvailable()) {
        try {
          await configureRevenueCat(); // Make sure your helper wraps this as an async process or wait a tick
        } catch (e) {
          console.warn("RC Config error", e);
        }
      }
      // Give the native bridge a tiny moment to settle before rendering billing items
      setTimeout(() => setIsSdkReady(true), 600);
    };

    initApp();

    let hasSynced = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("✅ Firebase session restored:", user.uid);
        useAuthStore.getState().setGuest(false);

        if (!hasSynced) {
          hasSynced = true;
          try {
            await syncUserData();
          } catch (err) {
            console.error("❌ Failed to sync user data:", err);
          }
        }
      } else {
        console.log("👤 No logged in user");
        useAuthStore.getState().setGuest(true);
        hasSynced = false;
      }
    });

    return unsubscribe;
  }, []);

  // 🚀 CRITICAL UI LOCK: Do not allow modal renders while the bridge is initializing
  if (!isSdkReady) {
    return (
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          backgroundColor: "#12c2e9",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          style={{ flex: 1, justifyContent: "center" }}
        />
      </View>
    );
  }

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}
