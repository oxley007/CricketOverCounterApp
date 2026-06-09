import { Alert } from "react-native";

type Props = {
  pickerType?: "batter" | "bowler";
  activeBatters?: any[];
  currentBowlerId?: string;
  onClose: () => void;
};

export function usePlayerSelectionValidation({
  pickerType,
  activeBatters,
  currentBowlerId,
  onClose,
}: Props) {
  const handleContinue = () => {
    const hasBatters = (activeBatters?.length ?? 0) > 0;
    const hasBowler = !!currentBowlerId;

    if (pickerType === "batter" && !hasBatters) {
      Alert.alert(
        "No Batter Selected",
        "Select at least one batter from the player list",
        [
          {
            text: "Back to select batter",
            style: "cancel",
          },
          {
            text: "Continue to scoring screen",
            onPress: onClose,
          },
        ],
      );
      return;
    }

    if (pickerType === "bowler" && !hasBowler) {
      Alert.alert(
        "No Bowler Selected",
        "Select a bowler from the player list",
        [
          {
            text: "Back to select bowler",
            style: "cancel",
          },
          {
            text: "Continue to scoring screen",
            onPress: onClose,
          },
        ],
      );
      return;
    }

    onClose();
  };

  return { handleContinue };
}
