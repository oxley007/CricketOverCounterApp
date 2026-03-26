import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";

type Props = {
  onUpgrade: () => void;
};

export default function UpgradeProBox({ onUpgrade }: Props) {
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const selectedMode = useStartModalStore((s) => s.selectedMode);

  console.log("UpgradeProBox mounted", { selectedMode });

  // Don't show if already unlocked
  if (proUnlocked) return null;

  // Determine which description to show
  const isScorebookOrNull =
    selectedMode === "scorebook" || selectedMode === null;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.textHeader}>Upgrade to Pro</Text>

        <Text style={styles.textDesc}>
          {isScorebookOrNull ? (
            // Text for Scorebook / Null mode
            <>
              Unlock player & team stats, previous fixtures & results, live
              partnership, previous innings over compare, average & highest
              partnership, dot-ball counter, and ball timer for this innings and
              all future innings. Free for the first 6 overs — upgrade to Pro to
              continue beyond that.
            </>
          ) : (
            // Text for Ball Counter mode
            <>
              Unlock live partnership, previous innings over compare, average &
              highest partnership, dot-ball counter, and ball timer for this
              innings and all future innings. Free for the first 6 overs —
              upgrade to Pro to continue beyond that.
            </>
          )}
        </Text>

        <Pressable style={styles.button} onPress={onUpgrade}>
          <Text style={styles.buttonText}>Upgrade</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    marginVertical: 12,
    alignItems: "center",
    backgroundColor: "#f6f9ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4f7cff",
  },
  info: {
    flex: 1,
  },
  textHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4f7cff",
  },
  textDesc: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#4f7cff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
