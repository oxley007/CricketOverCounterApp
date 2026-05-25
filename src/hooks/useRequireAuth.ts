// hooks/useRequireAuth.ts
import { useState, useCallback, useEffect, useRef } from "react";
import Alert from "react-native/Libraries/Alert/Alert";
import { auth } from "../services/firebaseConfig";
import { useAuthStore } from "../state/authStore";

type Options = {
  allowGuest?: boolean;
  enforceGuestLimit?: boolean;
};

export function useRequireAuth(options?: Options) {
  const [authVisible, setAuthVisible] = useState(false);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);
  const isRunningPendingRef = useRef(false);

  const runPendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    if (!action || isRunningPendingRef.current) return;

    pendingActionRef.current = null;
    setAuthVisible(false);
    isRunningPendingRef.current = true;

    void (async () => {
      try {
        await action();
      } finally {
        isRunningPendingRef.current = false;
      }
    })();
  }, []);

  // Resume stalled work once the user logs in or newly continues as guest
  useEffect(() => {
    if (!authVisible || !pendingActionRef.current) return;

    const isReady = () =>
      !!auth.currentUser || useAuthStore.getState().isGuest;

    if (isReady()) {
      runPendingAction();
      return;
    }

    let prevIsGuest = useAuthStore.getState().isGuest;

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (isRunningPendingRef.current || !pendingActionRef.current) return;

      if (auth.currentUser) {
        runPendingAction();
        return;
      }

      // Only resume when guest mode is newly enabled — not on guestMatchesPlayed bumps
      const becameGuest = !prevIsGuest && state.isGuest;
      prevIsGuest = state.isGuest;

      if (becameGuest) {
        runPendingAction();
      }
    });

    return unsubscribe;
  }, [authVisible, runPendingAction]);

  const dismissAuthGate = useCallback(() => {
    pendingActionRef.current = null;
    setAuthVisible(false);
  }, []);

  const requireAuth = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      const { allowGuest = true, enforceGuestLimit = false } = options || {};
      const { isGuest, guestMatchesPlayed } = useAuthStore.getState();

      if (!auth.currentUser && (!isGuest || !allowGuest)) {
        pendingActionRef.current = action;
        setAuthVisible(true);
        return false;
      }

      if (enforceGuestLimit && isGuest && guestMatchesPlayed >= 1) {
        Alert.alert(
          "Create a Free Account",
          "You've reached the guest match limit. Sign up for free to save more matches and stats.",
        );
        return false;
      }

      await action();
      return true;
    },
    [options],
  );

  return { requireAuth, authVisible, setAuthVisible, dismissAuthGate };
}
