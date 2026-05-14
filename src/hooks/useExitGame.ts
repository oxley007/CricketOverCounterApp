import { useRouter } from "expo-router";
import { useStartModalStore } from "../state/startModalStore";
import { useGameStore } from "../state/gameStore";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";

export const useExitGame = () => {
  const router = useRouter();

  const handleExitNoSave = () => {
    // 1. Get store instances
    const startModalStore = useStartModalStore.getState();
    const gameStore = useGameStore.getState();

    // 2. Perform all standard cleanup
    // Assuming resetGuestIfNeeded is available in scope or imported
    resetGuestIfNeeded();

    useFixtureStore.getState().saveCurrentInnings();
    useFixtureStore.setState({ currentFixture: undefined });
    useMatchStore.getState().resetInnings();

    gameStore.resetGame();
    gameStore.resetBatters();
    gameStore.setSetupComplete(false);
    gameStore.triggerSetup();

    // 3. Sequence state before navigating
    startModalStore.reset();
    startModalStore.open();

    // Use a small timeout to ensure Zustand state propagates
    setTimeout(() => {
      router.replace("/");
    }, 0);
  };

  return { handleExitNoSave };
};
