import { useState } from "react";
import { useRouter } from "expo-router";
import { useStartModalStore } from "../state/startModalStore";
import { useGameStore } from "../state/gameStore";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";
import { clearLiveEvents } from "../services/firestoreService";

export const useExitGame = () => {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false); // Add this state

  const handleExitNoSave = async () => {
    setIsExiting(true); // Start loading

    const startModalStore = useStartModalStore.getState();
    const gameStore = useGameStore.getState();
    const fixtureStore = useFixtureStore.getState();

    const teamId =
      gameStore.yourTeam?.id || fixtureStore.currentFixture?.yourTeam?.id;

    if (teamId) {
      try {
        await clearLiveEvents(teamId);
      } catch (error) {
        console.error("Failed to clear live events:", error);
      }
    }

    // Perform all standard cleanup
    resetGuestIfNeeded();
    fixtureStore.saveCurrentInnings();
    useFixtureStore.setState({ currentFixture: undefined });
    useMatchStore.getState().resetInnings();

    gameStore.resetGame();
    gameStore.resetBatters();
    gameStore.setSetupComplete(false);
    gameStore.triggerSetup();

    startModalStore.reset();
    startModalStore.open();

    setTimeout(() => {
      setIsExiting(false); // Reset loading state right before navigation
      router.replace("/");
    }, 0);
  };

  return { handleExitNoSave, isExiting }; // Return the boolean here
};
