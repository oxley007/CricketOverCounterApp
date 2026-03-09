import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { onAuthStateChanged } from "firebase/auth";
import { configureRevenueCat } from "../services/revenuecat";
import { syncUserData } from "../services/syncUserData";
import { useAuthStore } from "../state/authStore";
import { auth } from "./../services/firebaseConfig";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    configureRevenueCat();

    let hasSynced = false;

    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("✅ Firebase session restored:", user.uid);

        // ✅ Persist guest state
        useAuthStore.getState().setGuest(false);

        // ✅ Only sync user data once per session
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

        // ✅ Mark as guest
        useAuthStore.getState().setGuest(true);

        // Reset sync flag so next login triggers sync
        hasSynced = false;
      }
    });

    return unsubscribe;
  }, []);

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
