import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useRouter } from "expo-router";
import { auth } from "../services/firebaseConfig";
import { saveFixture } from "../services/firestoreService";
import { useAuthStore } from "../state/authStore";
import { useFixtureStore, type Fixture } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";
import { generateId } from "../utils/generateId";
import { deepMergeById } from "../services/firestoreMerge";
import AuthModal from "./AuthModal";
import EndGameModal from "./EndGameModal";
import NewInningsButton from "./NewInningsButton";

type EndInningsButtonProps = {
  onComplete?: () => void;
};

export default function EndInningsButton({
  onComplete,
}: EndInningsButtonProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Live store resets
  const resetInnings = useMatchStore((s) => s.resetInnings);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetBatters = useGameStore((s) => s.resetBatters);

  const resetStartModal = useStartModalStore((s) => s.reset);

  const [modalFixture, setModalFixture] = useState<any | null>(null); // snapshot for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const guestMatchesPlayed = useAuthStore((s) => s.guestMatchesPlayed);

  const [saving, setSaving] = useState(false);

  const allFixtures = useFixtureStore.getState().fixtures;
  console.log("📦 All fixtures:", JSON.stringify(allFixtures, null, 2));

  const incrementGuestMatches = useAuthStore((s) => s.incrementGuestMatches);
  const isGuest = useAuthStore((s) => s.isGuest);

  const requireAuth = async (action: () => Promise<void>) => {
    const isGuest = useAuthStore.getState().isGuest;
    const guestMatchesPlayed = useAuthStore.getState().guestMatchesPlayed;

    // User not logged in
    if (!auth.currentUser && !isGuest) {
      await new Promise<void>((resolve) => {
        setAuthVisible(true);

        const unsubscribe = useAuthStore.subscribe((state) => {
          if (!state.isGuest && auth.currentUser) {
            unsubscribe();
            resolve();
          }
        });
      });

      await action();
      return;
    }

    // Block guest users who reached limit
    if (isGuest && guestMatchesPlayed >= 1) {
      Alert.alert(
        "Create a Free Account",
        "You've reached the guest match limit...",
        [{ text: "Sign Up", onPress: () => setAuthVisible(true) }],
      );
      return;
    }

    await action();
  };

  /*
  const saveFixtureToFirebase = async (fixture: any) => {
    if (!auth.currentUser) {
      console.warn("⚠️ No authenticated user; cannot save fixture");
      return;
    }

    function cleanForFirestore(obj: any): any {
      if (Array.isArray(obj)) return obj.map(cleanForFirestore);
      if (obj && typeof obj === "object") {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined) // remove undefined
            .map(([k, v]) => [k, cleanForFirestore(v)]),
        );
      }
      return obj;
    }

    try {
      const userId = auth.currentUser.uid;
      const fixtureId = fixture.id || new Date().getTime().toString();

      console.log("Saving fixture for user:", userId, "fixtureId:", fixtureId);

      await setDoc(
        doc(db, "users", userId, "fixtures", fixtureId),
        cleanForFirestore({ ...fixture, savedAt: serverTimestamp() }),
        { merge: true }, // safe for first-time documents
      );

      console.log("✅ Fixture saved to Firebase:", fixtureId);
    } catch (err) {
      console.error("❌ Error saving fixture:", err);
      Alert.alert("Error", "Failed to save fixture to Firebase");
    }
  };
  */

  /* ======================== END GAME (SAVE) ======================== */
  const handleEndGame = async () => {
    setSaving(true);

    try {
      const fixtureStore = useFixtureStore.getState();
      const isGuest = useAuthStore.getState().isGuest;

      // 1️⃣ Increment guest matches if needed
      if (isGuest) useAuthStore.getState().incrementGuestMatches();

      // 2️⃣ Reset guest if needed
      resetGuestIfNeeded();

      // 3️⃣ Save current innings snapshot
      fixtureStore.saveCurrentInnings();

      // 4️⃣ Take a snapshot of the fixture BEFORE completing it
      const completedFixture = { ...fixtureStore.currentFixture } as Fixture;
      if (!completedFixture) {
        console.warn("⚠️ No current fixture to end");
        return;
      }

      // 🔹 Ensure ID is consistent
      if (!completedFixture.id) {
        completedFixture.id = generateId();
      }

      // 5️⃣ SAVE TO FIRESTORE + merge into local store safely
      try {
        await saveFixture(completedFixture);

        // Merge into local fixtures[]
        const merged = deepMergeById(fixtureStore.fixtures, [completedFixture]);
        useFixtureStore.setState({
          fixtures: merged,
          currentFixture: completedFixture,
        });

        console.log(
          "💾 Fixture saved and merged locally:",
          completedFixture.id,
        );
      } catch (err) {
        console.error("❌ Error saving fixture to Firebase:", err);
        const message =
          err instanceof Error && err.message.includes("authenticated user")
            ? "Please sign in to save fixtures."
            : "Failed to save fixture. Try again.";
        Alert.alert("Error", message);
        throw err; // rethrow so outer finally still runs
      }

      // 6️⃣ Commit to local store (mark as complete)
      fixtureStore.completeFixture();

      // 7️⃣ Update modal for end-game summary
      setModalFixture(completedFixture);
      setModalVisible(true);

      // 8️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 9️⃣ Reset start modal and navigate home
      router.replace("/").then(() => {
        useStartModalStore.getState().reset();
      });

      console.log(
        "🏁 Fixture ended and saved successfully:",
        completedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleEndGame:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ======================== ABANDON MATCH ======================== */
  const handleAbandonMatch = async () => {
    setSaving(true);

    try {
      const fixtureStore = useFixtureStore.getState();
      const isGuest = useAuthStore.getState().isGuest;

      // 1️⃣ Increment guest matches if needed
      if (isGuest) useAuthStore.getState().incrementGuestMatches();

      // 2️⃣ Reset guest if needed
      resetGuestIfNeeded();

      // 3️⃣ Save current innings snapshot
      fixtureStore.saveCurrentInnings();

      // 4️⃣ Take snapshot BEFORE marking abandoned
      const abandonedFixture = { ...fixtureStore.currentFixture } as Fixture;
      if (!abandonedFixture) {
        console.warn("⚠️ No current fixture to abandon");
        return;
      }

      // 🔹 Ensure ID is consistent
      if (!abandonedFixture.id) {
        abandonedFixture.id = generateId();
      }

      // 5️⃣ SAVE TO FIRESTORE + merge into local store safely
      try {
        await saveFixture(abandonedFixture);

        // Merge into local fixtures[]
        const merged = deepMergeById(fixtureStore.fixtures, [abandonedFixture]);
        useFixtureStore.setState({
          fixtures: merged,
          currentFixture: abandonedFixture,
        });

        console.log(
          "💾 Abandoned fixture saved and merged locally:",
          abandonedFixture.id,
        );
      } catch (err) {
        console.error("❌ Error saving abandoned fixture to Firebase:", err);
        const message =
          err instanceof Error && err.message.includes("authenticated user")
            ? "Please sign in to save fixtures."
            : "Failed to save abandoned fixture. Try again.";
        Alert.alert("Error", message);
        throw err;
      }

      // 6️⃣ Commit to local store (mark as abandoned)
      fixtureStore.markFixtureAbandoned();

      // 7️⃣ Update modal for end-game summary
      setModalFixture(abandonedFixture);
      setModalVisible(true);

      // 8️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 9️⃣ Reset start modal and navigate home
      router.replace("/").then(() => {
        useStartModalStore.getState().reset();
      });

      console.log(
        "🟠 Fixture abandoned and saved successfully:",
        abandonedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleAbandonMatch:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ======================== END GAME WITHOUT SAVE ======================== */
  const handleEndGameNoSave = () => {
    setVisible(false);

    resetGuestIfNeeded();

    const fixtureStore = useFixtureStore.getState();

    const fixtureSnapshot = JSON.parse(
      JSON.stringify(fixtureStore.currentFixture),
    );

    setModalFixture(fixtureSnapshot);

    fixtureStore.clearCurrentFixture();

    // Reset stores
    // Reset stores
    resetInnings();
    resetBatters();
    resetGame();

    // Reset modal after navigation
    router.replace("/").then(() => {
      resetStartModal();
    });
  };

  return (
    <View>
      {/* END INNINGS BUTTON */}
      <Button
        mode="contained"
        onPress={() => setVisible(true)}
        style={styles.button}
        icon={() => <Icon name="flag-checkered" size={20} color="#c471ed" />}
        labelStyle={styles.buttonLabel}
      >
        End Innings
      </Button>

      {/* OPTIONS MODAL */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.title}>End current innings?</Text>
          <Text style={styles.subtitle}>
            Choose what you would like to do next.
          </Text>

          <NewInningsButton onComplete={() => setVisible(false)} />

          <View style={styles.actionsColumn}>
            <Button
              mode="contained"
              buttonColor="#f97316"
              disabled={saving}
              onPress={async () => {
                setSaving(true);
                await requireAuth(handleAbandonMatch); // or handleAbandonMatch
                setSaving(false);
              }}
            >
              Match Abandoned (save stats, no result)
            </Button>

            <Button
              mode="contained"
              buttonColor="#c471ed"
              disabled={saving}
              onPress={async () => {
                setSaving(true);
                await requireAuth(handleEndGame); // or handleAbandonMatch
                setSaving(false);
              }}
              style={styles.primaryAction}
            >
              End Game (Save, with result)
            </Button>

            <Button
              mode="outlined"
              buttonColor="#888"
              onPress={handleEndGameNoSave}
            >
              End Game Without Saving
            </Button>

            <Button onPress={() => setVisible(false)}>Cancel</Button>
          </View>
        </Modal>
      </Portal>

      {/* END GAME SUMMARY MODAL */}
      {modalFixture && (
        <EndGameModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          fixture={modalFixture}
        />
      )}
      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 10,
    marginTop: 10,
  },
  buttonLabel: {
    color: "#c471ed",
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: "#555",
  },
  actionsColumn: {
    gap: 12,
  },
  primaryAction: {
    borderRadius: 8,
  },
});
