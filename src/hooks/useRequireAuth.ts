// hooks/useRequireAuth.ts
import { useState, useCallback } from "react";
import { auth } from "../services/firebaseConfig";
import { useAuthStore } from "../state/authStore";

type Options = {
  allowGuest?: boolean;
  enforceGuestLimit?: boolean;
};

export function useRequireAuth(options?: Options) {
  const [authVisible, setAuthVisible] = useState(false);

  const requireAuth = useCallback(
    async (action: () => Promise<void>) => {
      const { allowGuest = true, enforceGuestLimit = false } = options || {};
      const { isGuest, guestMatchesPlayed } = useAuthStore.getState();

      // 🚧 Not logged in
      if (!auth.currentUser && (!isGuest || !allowGuest)) {
        await new Promise<void>((resolve) => {
          setAuthVisible(true);

          const unsubscribe = useAuthStore.subscribe((state) => {
            if (auth.currentUser || state.isGuest) {
              unsubscribe();
              resolve();
            }
          });
        });

        // user closed modal without logging in
        if (!auth.currentUser && !useAuthStore.getState().isGuest) return;
      }

      // 🚧 Guest limit
      if (enforceGuestLimit && isGuest && guestMatchesPlayed >= 1) {
        setAuthVisible(true);
        return;
      }

      await action();
    },
    [options],
  );

  return {
    requireAuth,
    authVisible,
    setAuthVisible,
  };
}
