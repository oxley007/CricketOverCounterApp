import { useEffect } from "react";
import { useStartModalStore } from "../state/startModalStore";

/** Keeps StartModeModal in sync: open when no mode selected, closed while in a mode. */
export function useStartModalGate() {
  const selectedMode = useStartModalStore((s) => s.selectedMode);
  const openStartModal = useStartModalStore((s) => s.open);
  const closeStartModal = useStartModalStore((s) => s.close);

  useEffect(() => {
    if (selectedMode === null) {
      openStartModal();
    } else {
      closeStartModal();
    }
  }, [selectedMode, openStartModal, closeStartModal]);
}
