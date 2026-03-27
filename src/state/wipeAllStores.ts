import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "./authStore";
import { useFixtureStore } from "./fixtureStore";
import { useGameStore } from "./gameStore";
import { useMatchStore } from "./matchStore";
import { useStartModalStore } from "./startModalStore";
import { useTeamStore } from "./teamStore";

export const wipeAllStores = async () => {
  try {
    // 1️⃣ Reset ALL zustand stores (memory)
    useAuthStore.getState().reset();
    useFixtureStore.getState().reset();
    useGameStore.getState().reset();
    useMatchStore.getState().reset();
    useStartModalStore.getState().reset();
    useTeamStore.getState().reset();

    // 2️⃣ Clear persisted storage
    await AsyncStorage.multiRemove([
      "auth-storage",
      "cricket-fixtures",
      "cricket-game-store",
      "cricket-start-modal",
      "@teams",
    ]);

    // 3️⃣ Clear SecureStore (match events)
    await SecureStore.deleteItemAsync("cricket-match-events");

    console.log("🧨 All stores wiped clean");
  } catch (e) {
    console.error("❌ wipeAllStores failed:", e);
  }
};
