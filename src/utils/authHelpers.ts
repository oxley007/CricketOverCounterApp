import { useAuthStore } from "../state/authStore";

export const resetGuestIfNeeded = () => {
  const { isGuest, setGuest } = useAuthStore.getState();

  if (isGuest) {
    setGuest(false);
  }
};
