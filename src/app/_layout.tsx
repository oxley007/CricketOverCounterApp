import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

import { onAuthStateChanged } from "firebase/auth";
import {
  configureRevenueCat,
  isRevenueCatAvailable,
} from "../services/revenuecat";
import { syncUserData } from "../services/syncUserData";
import AuthModal from "../components/AuthModal";
import { useAuthModalStore } from "../state/authModalStore";
import { useAuthStore } from "../state/authStore";
import { auth } from "./../services/firebaseConfig";

function GlobalAuthModal() {
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const close = useAuthModalStore((s) => s.close);

  return <AuthModal visible={isOpen} onClose={close} />;
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      if (isRevenueCatAvailable()) {
        try {
          await configureRevenueCat();
        } catch (e) {
          console.warn("RC Config error", e);
        }
      }
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
      {/* DarkTheme references completely scrubbed - forcing DefaultTheme */}
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <GlobalAuthModal />
        <StatusBar style="dark" />
      </ThemeProvider>
    </PaperProvider>
  );
}
