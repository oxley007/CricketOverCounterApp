import { Redirect } from "expo-router";
import { useStartModalStore } from "../../state/startModalStore";

export default function Index() {
  const { selectedMode, hasHydrated } = useStartModalStore();

  if (!hasHydrated) return null;

  if (selectedMode === "scorebook") {
    return <Redirect href="/scorebook" />;
  }

  if (selectedMode === "ballCounter") {
    return <Redirect href="/ball-counter" />;
  }

  // first launch fallback
  return <Redirect href="/ball-counter" />;
}
