import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useRouter } from "expo-router";
import { auth } from "../services/firebaseConfig";
import {
  saveFixture,
  saveTeamWithPlayers,
} from "../services/firestoreService";
import { useAuthStore } from "../state/authStore";
import { useFixtureStore, type Fixture } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useTeamStore } from "../state/teamStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { calculateFixtureResult } from "../utils/calculateFixtureResult";
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

      // 3️⃣ Save current innings snapshot (updates store)
      fixtureStore.saveCurrentInnings();

      // 4️⃣ Re-read fixture from store so we have the innings we just saved
      const completedFixture = {
        ...useFixtureStore.getState().currentFixture,
      } as Fixture;
      if (!completedFixture) {
        console.warn("⚠️ No current fixture to end");
        return;
      }

      // 🔹 Ensure ID is consistent
      if (!completedFixture.id) {
        completedFixture.id = generateId();
      }

      // 🔹 Set result and completed before saving so Firestore has final state
      completedFixture.result = calculateFixtureResult(completedFixture);
      completedFixture.completed = true;

      // 5️⃣ SAVE TO FIRESTORE + merge into local store safely
      try {
        await saveFixture(completedFixture);

        // Merge into local fixtures[] (use latest store state)
        const merged = deepMergeById(
          useFixtureStore.getState().fixtures,
          [completedFixture],
        );
        useFixtureStore.setState({
          fixtures: merged,
          currentFixture: completedFixture,
        });

        console.log(
          "💾 Fixture saved and merged locally:",
          completedFixture.id,
        );

        // 5b Save teams and players used in this fixture (best-effort)
        const teams = useTeamStore.getState().teams;
        const yourTeam = completedFixture.yourTeam?.id
          ? teams.find((t) => t.id === completedFixture.yourTeam!.id)
          : null;
        const oppositionTeam = completedFixture.oppositionTeam?.id
          ? teams.find((t) => t.id === completedFixture.oppositionTeam!.id)
          : null;
        for (const team of [yourTeam, oppositionTeam]) {
          if (team) {
            try {
              await saveTeamWithPlayers(team);
              console.log("💾 Team saved:", team.name);
            } catch (e) {
              console.warn("⚠️ Failed to save team:", team.name, e);
            }
          }
        }
      } catch (err) {
        console.error("❌ Error saving fixture to Firebase:", err);
        const message =
          err instanceof Error && err.message.includes("authenticated user")
            ? "Please sign in to save fixtures."
            : "Failed to save fixture. Try again.";
        Alert.alert("Error", message);
        throw err; // rethrow so outer finally still runs
      }

      // 6️⃣ Clear current fixture (completed fixture is already in fixtures from merge)
      useFixtureStore.setState({ currentFixture: undefined });

      // 7️⃣ Update modal for end-game summary
      setModalFixture(completedFixture);
      setModalVisible(true);

      // 8️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 9️⃣ Reset start modal and navigate home
      router.replace("/");
      useStartModalStore.getState().reset();

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

      // 3️⃣ Save current innings snapshot (updates store)
      fixtureStore.saveCurrentInnings();

      // 4️⃣ Re-read fixture from store so we have the innings we just saved
      const abandonedFixture = {
        ...useFixtureStore.getState().currentFixture,
      } as Fixture;
      if (!abandonedFixture) {
        console.warn("⚠️ No current fixture to abandon");
        return;
      }

      // 🔹 Ensure ID is consistent
      if (!abandonedFixture.id) {
        abandonedFixture.id = generateId();
      }

      // 🔹 Set abandoned, result and completed before saving so Firestore has final state
      abandonedFixture.abandoned = true;
      abandonedFixture.result = calculateFixtureResult({
        ...abandonedFixture,
        abandoned: true,
      });
      abandonedFixture.completed = true;

      // 5️⃣ SAVE TO FIRESTORE + merge into local store safely
      try {
        await saveFixture(abandonedFixture);

        // Merge into local fixtures[] (use latest store state)
        const merged = deepMergeById(
          useFixtureStore.getState().fixtures,
          [abandonedFixture],
        );
        useFixtureStore.setState({
          fixtures: merged,
          currentFixture: abandonedFixture,
        });

        console.log(
          "💾 Abandoned fixture saved and merged locally:",
          abandonedFixture.id,
        );

        // 5b Save teams and players used in this fixture (best-effort)
        const teams = useTeamStore.getState().teams;
        const yourTeam = abandonedFixture.yourTeam?.id
          ? teams.find((t) => t.id === abandonedFixture.yourTeam!.id)
          : null;
        const oppositionTeam = abandonedFixture.oppositionTeam?.id
          ? teams.find((t) => t.id === abandonedFixture.oppositionTeam!.id)
          : null;
        for (const team of [yourTeam, oppositionTeam]) {
          if (team) {
            try {
              await saveTeamWithPlayers(team);
              console.log("💾 Team saved:", team.name);
            } catch (e) {
              console.warn("⚠️ Failed to save team:", team.name, e);
            }
          }
        }
      } catch (err) {
        console.error("❌ Error saving abandoned fixture to Firebase:", err);
        const message =
          err instanceof Error && err.message.includes("authenticated user")
            ? "Please sign in to save fixtures."
            : "Failed to save abandoned fixture. Try again.";
        Alert.alert("Error", message);
        throw err;
      }

      // 6️⃣ Clear current fixture (abandoned fixture is already in fixtures from merge)
      useFixtureStore.setState({ currentFixture: undefined });

      // 7️⃣ Update modal for end-game summary
      setModalFixture(abandonedFixture);
      setModalVisible(true);

      // 8️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 9️⃣ Reset start modal and navigate home
      router.replace("/");
      useStartModalStore.getState().reset();

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
    router.replace("/");
    resetStartModal();
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
