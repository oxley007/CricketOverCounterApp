import React from "react";
import { View, Text, Pressable, Modal, StyleSheet, Image } from "react-native";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import { router } from "expo-router";

export default function StartModeModal() {
  const { isOpen, selectBallCounter, selectScorebook } = useStartModalStore();
  const openMatchRulesModal = useMatchStore((s) => s.openMatchRulesModal);

  const onBallCounter = () => {
    selectBallCounter();
    openMatchRulesModal();
  };

  const onScorebook = () => {
    selectScorebook();
    router.replace("/scorebook");
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/4dot6logo-transparent.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerText}>Select your mode</Text>
          </View>

          {/* Ball Counter Card */}
          <Pressable style={[styles.card, styles.ballCounter]} onPress={onBallCounter}>
            <Image
              source={require("../../../assets/4dot6logo-transparent.png")}
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={[styles.cardText, styles.ballCounterText]}>Ball Counter</Text>
          </Pressable>

          {/* Scorebook Card */}
          <Pressable style={[styles.card, styles.scorebook]} onPress={onScorebook}>
            <Image
              source={require("../../../assets/4dot6logo-transparent-old_inverse.png")}
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={[styles.cardText, styles.scorebookText]}>Scorebook</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    padding: 20,
  },

  // Header styles
  header: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 20,
  },
  headerLogo: {
    width: 240,
    height: undefined,
    aspectRatio: 1.8,
    marginBottom: 0,
  },
  headerText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "600",
  },

  // Card buttons
  card: {
    width: "100%",
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardLogo: {
    width: 180,
    height: undefined,
    aspectRatio: 1.8,
    marginBottom: 2,
  },
  cardText: {
    fontSize: 38,
    fontWeight: "700",
  },
  ballCounter: {
    backgroundColor: "#12c2e9",
  },
  ballCounterText: {
    color: "#fff",
  },
  scorebook: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#12c2e9",
  },
  scorebookText: {
    color: "#12c2e9",
  },
});
