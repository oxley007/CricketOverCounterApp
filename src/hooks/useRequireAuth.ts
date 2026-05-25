// hooks/useRequireAuth.ts
import { useState, useCallback, useEffect } from "react";
import { auth } from "../services/firebaseConfig";
import { useAuthStore } from "../state/authStore";

type Options = {
  allowGuest?: boolean;
  enforceGuestLimit?: boolean;
};

export function useRequireAuth(options?: Options) {
  const [authVisible, setAuthVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Clean, reactive listener that handles memory management perfectly
  useEffect(() => {
    if (!authVisible || !pendingAction) return;

    // Subscribe to store updates safely
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (auth.currentUser || state.isGuest) {
        // Execute the stalled action now that they logged in
        pendingAction();
        setPendingAction(null);
        setAuthVisible(false);
      }
    });

    // React automatically runs this cleanup function when the modal closes
    return () => {
      unsubscribe();
    };
  }, [authVisible, pendingAction]);

  const requireAuth = useCallback(
    async (action: () => Promise<void>) => {
      const { allowGuest = true, enforceGuestLimit = false } = options || {};
      const { isGuest, guestMatchesPlayed } = useAuthStore.getState();

      if (!auth.currentUser && (!isGuest || !allowGuest)) {
        // ✅ Change this line inside your requireAuth function:
        setPendingAction(() => () => action());

        setAuthVisible(true);
        return;
      }

      if (enforceGuestLimit && isGuest && guestMatchesPlayed >= 1) {
        setAuthVisible(true);
        return;
      }

      await action();
    },
    [options],
  );

  return { requireAuth, authVisible, setAuthVisible };
}
