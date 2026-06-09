import { useLiveStore } from "../state/liveStore";

export const useIsLiveViewer = () => {
  return useLiveStore((state) => state.isReadOnly);
};
