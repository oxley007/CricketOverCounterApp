// hooks/useCurrentUserId.ts
import { useState, useEffect } from "react";
import { auth } from "../services/firebaseConfig"; // Adjust path to your config file

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return unsubscribe;
  }, []);

  return userId;
}
