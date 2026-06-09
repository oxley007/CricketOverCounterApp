import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export const useFeedback = () => {
  // Use useCallback so the function doesn't get re-created on every render
  const triggerTap = useCallback(() => {
    Haptics.selectionAsync(); // Subtle tap
  }, []);

  const triggerSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return { triggerTap, triggerSuccess };
};
