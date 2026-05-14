import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
//import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import { useRouter } from "expo-router";
//import { auth } from "../services/firebaseConfig";
import {
  saveFixture,
  saveSubscription,
  saveTeamWithPlayers,
  clearLiveEvents,
  saveLiveFixture,
  deletePublicFixture,
} from "../services/firestoreService";
import { useAuthStore } from "../state/authStore";
import { useFixtureStore, type Fixture } from "../state/fixtureStore";
import { useGameStore } from "../state/gameStore";
import { useMatchStore } from "../state/matchStore";
import { useStartModalStore } from "../state/startModalStore";
import { useTeamStore } from "../state/teamStore";
import { useLiveStore } from "../state/liveStore";
import { useUIStore } from "../state/uiStore";
import { resetGuestIfNeeded } from "../utils/authHelpers";
import { calculateFixtureResult } from "../utils/calculateFixtureResult";
import { generateId } from "../utils/generateId";
import AuthModal from "./AuthModal";
import NewInningsButton from "./NewInningsButton";
import { useRequireAuth } from "../hooks/useRequireAuth";

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

  //const [modalFixture, setModalFixture] = useState<any | null>(null); // snapshot for modal
  //const [modalVisible, setModalVisible] = useState(false);
  //const [authVisible, setAuthVisible] = useState(false);
  //const guestMatchesPlayed = useAuthStore((s) => s.guestMatchesPlayed);

  const saving = useUIStore((s) => s.saving);
  const setSaving = useUIStore((s) => s.setSaving);

  const currentFixture = useFixtureStore((s) => s.currentFixture);

  //const incrementGuestMatches = useAuthStore((s) => s.incrementGuestMatches);
  //const isGuest = useAuthStore((s) => s.isGuest);

  const selectedMode = useStartModalStore((s) => s.selectedMode);
  //const isScorebook = selectedMode === "scorebook";

  const { requireAuth, authVisible, setAuthVisible } = useRequireAuth({
    enforceGuestLimit: true,
  });

  /*
  const requireAuth = async (action: () => Promise<void>) => {
    const isGuest = useAuthStore.getState().isGuest;
    const guestMatchesPlayed = useAuthStore.getState().guestMatchesPlayed;

    // User not logged in
    if (!auth.currentUser && !isGuest) {
      await new Promise<void>((resolve) => {
        setAuthVisible(true);

        const unsubscribe = useAuthStore.subscribe((state) => {
          if (auth.currentUser || state.isGuest) {
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
  */

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

      const completedFixture = JSON.parse(
        JSON.stringify(useFixtureStore.getState().currentFixture),
      ) as Fixture;
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

      // 5️⃣ SAVE TO FIRESTORE + update local store safely
      try {
        await saveFixture(completedFixture);

        // Replace or append this fixture in local fixtures[]
        useFixtureStore.setState((state) => ({
          fixtures: [
            ...state.fixtures.filter((f) => f.id !== completedFixture.id),
            completedFixture,
          ],
          currentFixture: completedFixture,
        }));

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

        // 5c Sync IAP/subscription status to Firestore (best-effort)
        try {
          await saveSubscription(useMatchStore.getState().proUnlocked ?? false);
        } catch (e) {
          console.warn("⚠️ Failed to save subscription status:", e);
        }

        // ✅ Clear live Firebase events (match is finished)
        const liveStore = useLiveStore.getState();

        /*
        const liveTeam = liveStore.teams.find(
          (t) => t.teamId === completedFixture.yourTeam?.id,
        );
        */

        if (liveStore.teamCode) {
          try {
            await clearLiveEvents(liveStore.teamCode);
          } catch (e) {
            console.warn("⚠️ Failed to clear live events:", e);
          }
        }

        if (liveStore.teamCode) {
          try {
            await saveLiveFixture(liveStore.teamCode, completedFixture);
          } catch (e) {
            console.warn("⚠️ Failed to save public fixture:", e);
          }
        }
      } catch (err) {
        console.error("❌ Error saving fixture to Firebase:", err);
        Alert.alert("Error", "Failed to save fixture. Try again.");
        throw err; // rethrow so outer finally runs finally
      }

      // Ensure the options modal is closed before navigating
      setVisible(false);

      const modeAtTimeOfReset = selectedMode;

      // 7️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 8️⃣ Reset start modal and navigate to summary
      useStartModalStore.getState().reset();

      // 🔑 reset game setup modal state
      useGameStore.getState().setSetupComplete(true);

      console.log(
        "🏁 Ending game innings:",
        JSON.stringify(completedFixture.innings, null, 2),
      );

      onComplete?.();

      router.replace({
        pathname: "/match-summary",
        params: {
          //fixtureId: currentFixture?.id,
          fixtureId: fixtureSnapshot.id,
          prevMode: modeAtTimeOfReset,
        },
      });

      console.log(
        "🏁 Fixture ended and saved successfully:",
        completedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleEndGame:", err);
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

      const abandonedFixture = JSON.parse(
        JSON.stringify(useFixtureStore.getState().currentFixture),
      ) as Fixture;
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

      // 5️⃣ SAVE TO FIRESTORE + update local store safely
      try {
        await saveFixture(abandonedFixture);

        // Replace or append this fixture in local fixtures[]
        useFixtureStore.setState((state) => ({
          fixtures: [
            ...state.fixtures.filter((f) => f.id !== abandonedFixture.id),
            abandonedFixture,
          ],
          currentFixture: abandonedFixture,
        }));

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

        // 5c Sync IAP/subscription status to Firestore (best-effort)
        try {
          await saveSubscription(useMatchStore.getState().proUnlocked ?? false);
        } catch (e) {
          console.warn("⚠️ Failed to save subscription status:", e);
        }

        // ✅ Clear live Firebase events (match is finished)
        const liveStore = useLiveStore.getState();

        /*
        const liveTeam = liveStore.teams.find(
          (t) => t.teamId === abandonedFixture.yourTeam?.id,
        );
        */

        if (liveStore.teamCode) {
          try {
            await clearLiveEvents(liveStore.teamCode);
          } catch (e) {
            console.warn("⚠️ Failed to clear live events:", e);
          }
        }

        if (liveStore.teamCode) {
          try {
            await saveLiveFixture(liveStore.teamCode, abandonedFixture);
          } catch (e) {
            console.warn("⚠️ Failed to save public fixture:", e);
          }
        }
      } catch (err) {
        console.error("❌ Error saving abandoned fixture to Firebase:", err);
        Alert.alert("Error", "Failed to save abandoned fixture. Try again.");
        throw err;
      }

      // Ensure the options modal is closed before navigating
      setVisible(false);

      // 7️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      // 8️⃣ Reset start modal and navigate to summary
      useStartModalStore.getState().reset();

      // 🔑 reset game setup modal state
      useGameStore.getState().setSetupComplete(true);

      onComplete?.();

      router.replace({
        pathname: "/match-summary",
        params: { fixtureId: abandonedFixture.id },
      });

      console.log(
        "🟠 Fixture abandoned and saved successfully:",
        abandonedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleAbandonMatch:", err);
      setSaving(false);
    }
  };

  /* ======================== END GAME WITHOUT SAVE ======================== */
  const handleEndGameNoSave = async () => {
    resetGuestIfNeeded();

    const fixtureStore = useFixtureStore.getState();
    // Best-effort: persist the final innings snapshot into the in-memory fixture
    fixtureStore.saveCurrentInnings();

    const currentFixture = useFixtureStore.getState().currentFixture;
    const fixtureSnapshot = currentFixture
      ? (JSON.parse(JSON.stringify(currentFixture)) as Fixture)
      : null;

    if (!fixtureSnapshot) {
      // Nothing to summarize; just return to home flow
      resetInnings();
      resetBatters();
      resetGame();
      resetStartModal();
      useGameStore.getState().setSetupComplete(false);
      useGameStore.getState().triggerSetup();
      onComplete?.();
      router.replace("/");
      return;
    }

    // Mark as completed locally (no Firestore save)
    fixtureSnapshot.completed = true;
    fixtureSnapshot.result = calculateFixtureResult(fixtureSnapshot);

    const liveStore = useLiveStore.getState();

    /*
    const liveTeam = liveStore.teams.find(
      (t) => t.teamId === fixtureSnapshot.yourTeam?.id,
    );
    */

    if (liveStore.teamCode) {
      try {
        await clearLiveEvents(liveStore.teamCode);
      } catch (e) {
        console.warn("⚠️ Failed to clear live events:", e);
      }
    }

    // 🧹 DELETE PUBLIC FIXTURE (important for "no save")
    const teamId = fixtureSnapshot.yourTeam?.id;
    const fixtureId = fixtureSnapshot.id;

    if (teamId && fixtureId) {
      try {
        await deletePublicFixture(teamId, fixtureId);
      } catch (e) {
        console.warn("⚠️ Failed to delete public fixture:", e);
      }
    }

    // Keep it in memory so `match-summary` can render it without relying on fixtures[]
    useFixtureStore.setState({ currentFixture: fixtureSnapshot });

    const modeAtTimeOfReset = selectedMode;

    // Reset stores
    resetInnings();
    resetBatters();
    resetGame();

    // Ensure the options modal is closed before navigating
    setVisible(false);

    // Reset modal state and navigate to summary
    resetStartModal();

    // 🔑 reset game setup modal state
    // 🔑 Reset game setup modal state to FALSE so it re-opens next time
    useGameStore.getState().setSetupComplete(false);

    // Ensure the trigger is also reset or incremented if needed
    useGameStore.getState().triggerSetup();

    //router.replace("/");

    onComplete?.();

    router.replace({
      pathname: "/match-summary",
      params: {
        //fixtureId: currentFixture?.id,
        fixtureId: fixtureSnapshot.id,
        prevMode: modeAtTimeOfReset,
      },
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
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.title}>End current innings?</Text>
            <Text style={styles.subtitle}>
              Choose what you would like to do next.
            </Text>

            <NewInningsButton onComplete={() => setVisible(false)} />

            <View style={styles.actionsColumn}>
              <Button
                mode="contained"
                buttonColor="#c471ed"
                disabled={saving}
                onPress={async () => {
                  setSaving(true);
                  try {
                    await requireAuth(async () => {
                      await handleEndGame();
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
                style={styles.primaryAction}
                labelStyle={{ color: "#fff" }} // make sure text renders
              >
                {selectedMode === "scorebook"
                  ? "End Game (Save, with result)"
                  : "Reset Ball Counter"}
              </Button>
              {selectedMode === "scorebook" && (
                <>
                  <Button
                    mode="contained"
                    buttonColor="#f97316"
                    disabled={saving}
                    onPress={async () => {
                      setSaving(true);
                      try {
                        await requireAuth(async () => {
                          await handleAbandonMatch();
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Match Abandoned (save stats, no result)
                  </Button>

                  <Button
                    mode="outlined"
                    buttonColor="transparent"
                    onPress={handleEndGameNoSave}
                  >
                    {selectedMode === "scorebook"
                      ? "End Game Without Saving"
                      : "Reset Ball Counter"}
                  </Button>
                </>
              )}

              <Button onPress={() => setVisible(false)}>Cancel</Button>
            </View>
            {selectedMode === "scorebook" && (
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Text
                  style={styles.fullScorecardLink}
                  onPress={() => {
                    setVisible(false);

                    router.push({
                      pathname: "/fixture-scorecard",
                      params: {
                        fixtureId: currentFixture?.id,
                        from: "scorebook",
                      },
                    });
                  }}
                >
                  Full Scorecard
                </Text>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>

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
    maxHeight: Dimensions.get("window").height * 0.88,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 24,
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
  fullScorecardLink: {
    textDecorationLine: "underline",
    fontSize: 16,
    color: "#c471ed",
    textAlign: "center",
  },
  loadingContainer: {
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
