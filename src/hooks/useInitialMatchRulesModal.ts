import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const FIRST_LAUNCH_KEY = "hasSeenMatchRules";

export function useInitialMatchRulesModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const hasSeen = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);

      if (!hasSeen) {
        setVisible(true);
      }
    })();
  }, []);

  const close = async () => {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
    setVisible(false);
  };

  return { visible, close, open: () => setVisible(true) };
}
