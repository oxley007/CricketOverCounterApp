import { Redirect } from "expo-router";
import { useStartModalStore } from "../../state/startModalStore";

export default function Index() {
  const { selectedMode } = useStartModalStore();

  if (selectedMode === "scorebook") {
    return <Redirect href="/scorebook" />;
  }

  if (selectedMode === "ballCounter") {
    return <Redirect href="/ball-counter" />;
  }

  // fallback ALWAYS works
  return <Redirect href="/ball-counter" />;
}
