import { useIsFocused } from "expo-router/react-navigation";
import React, { useEffect, useRef, useState } from "react";
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
import { auth } from "../services/firebaseConfig";
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
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  const navigateToMatchSummary = (params: {
    fixtureId: string;
    prevMode?: string | null;
  }) => {
    if (!isFocusedRef.current) {
      console.log(
        "Screen lost focus during save; navigating to match-summary anyway",
      );
    }

    setVisible(false);
    useStartModalStore.getState().close();

    router.replace({
      pathname: "/match-summary",
      params: {
        fixtureId: params.fixtureId,
        prevMode: params.prevMode ?? undefined,
      },
    });
  };

  const [visible, setVisible] = useState(false);
  const endGameInProgressRef = useRef(false);

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
  const isSaving = useStartModalStore((state) => state.isSaving);

  const currentFixture = useFixtureStore((s) => s.currentFixture);

  //const incrementGuestMatches = useAuthStore((s) => s.incrementGuestMatches);
  //const isGuest = useAuthStore((s) => s.isGuest);

  const selectedMode = useStartModalStore((s) => s.selectedMode);
  //const isScorebook = selectedMode === "scorebook";

  const { requireAuth, authVisible, dismissAuthGate } = useRequireAuth({
    enforceGuestLimit: true,
  });

  const clearSavingState = () => {
    setSaving(false);
    useStartModalStore.getState().setIsSaving(false);
  };

  /** resetGame() marks setup incomplete; call after end-game resets so setup UI stays hidden on match-summary. */
  const suppressSetupModalUntilNewGame = () => {
    useGameStore.getState().setSetupComplete(true);
  };

  const runProtectedSaveAction = async (
    action: () => Promise<void>,
  ): Promise<void> => {
    setSaving(true);
    useStartModalStore.getState().setIsSaving(true);

    try {
      const { isGuest, guestMatchesPlayed } = useAuthStore.getState();
      const hasSession = !!auth.currentUser || isGuest;

      if (hasSession) {
        if (isGuest && guestMatchesPlayed >= 1) {
          Alert.alert(
            "Create a Free Account",
            "You've reached the guest match limit. Sign up for free to save more matches and stats.",
          );
          return;
        }

        await action();
        dismissAuthGate();
        return;
      }

      const executed = await requireAuth(action);
      if (!executed) return;
      dismissAuthGate();
    } catch (e) {
      console.error("❌ End game or auth failed:", e);
      throw e;
    } finally {
      clearSavingState();
    }
  };

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
    if (endGameInProgressRef.current) return;

    endGameInProgressRef.current = true;
    const wasGuest = useAuthStore.getState().isGuest;

    try {
      const fixtureStore = useFixtureStore.getState();

      if (!fixtureStore.currentFixture && useGameStore.getState().gameConfig) {
        await fixtureStore.startFixture();
      }

      // Save current innings snapshot (updates store)
      fixtureStore.saveCurrentInnings();

      const completedFixture = JSON.parse(
        JSON.stringify(useFixtureStore.getState().currentFixture),
      ) as Fixture;
      if (!completedFixture) {
        console.warn("⚠️ No current fixture to end");
        Alert.alert(
          "Nothing to save",
          "No match data was found. Finish game setup and try again.",
        );
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
        if (wasGuest) {
          console.log(
            "👤 Guest mode detected: Skipping remote Firestore sync, writing locally only.",
          );

          useFixtureStore.setState((state) => ({
            fixtures: [
              ...state.fixtures.filter((f) => f.id !== completedFixture.id),
              completedFixture,
            ],
            currentFixture: completedFixture,
          }));
        } else {
          // Normal authenticated user flow
          await saveFixture(completedFixture);

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
            await saveSubscription(
              useMatchStore.getState().proUnlocked ?? false,
            );
          } catch (e) {
            console.warn("⚠️ Failed to save subscription status:", e);
          }

          // ✅ Clear live Firebase events (match is finished)
          const liveStore = useLiveStore.getState();

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
        } // End of authenticate check branch block
      } catch (err) {
        console.error("❌ Error saving fixture to Firebase:", err);
        Alert.alert("Error", "Failed to save fixture. Try again.");
        throw err;
      }

      const modeAtTimeOfReset = selectedMode;

      // 7️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      suppressSetupModalUntilNewGame();

      console.log(
        "🏁 Ending game innings:",
        JSON.stringify(completedFixture.innings, null, 2),
      );

      onComplete?.();

      // Keep completed fixture in fixtures[] so match-summary can resolve it by id
      useFixtureStore.setState({
        currentFixture: undefined,
        fixtures: [
          ...useFixtureStore
            .getState()
            .fixtures.filter((f) => f.id !== completedFixture.id),
          completedFixture,
        ],
      });

      if (wasGuest) {
        useAuthStore.getState().incrementGuestMatches();
      }

      dismissAuthGate();

      navigateToMatchSummary({
        fixtureId: completedFixture.id,
        prevMode: modeAtTimeOfReset,
      });

      console.log(
        "🏁 Fixture ended and saved successfully:",
        completedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleEndGame:", err);
    } finally {
      endGameInProgressRef.current = false;
    }
  };

  /* ======================== ABANDON MATCH ======================== */
  const handleAbandonMatch = async () => {
    try {
      const fixtureStore = useFixtureStore.getState();
      const isGuest = useAuthStore.getState().isGuest;

      // 1️⃣ Increment guest matches if needed
      if (isGuest) useAuthStore.getState().incrementGuestMatches();

      // 2️⃣ Save current innings snapshot (updates store)
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

      // 7️⃣ Reset live stores
      useMatchStore.getState().resetInnings();
      useGameStore.getState().resetBatters();
      useGameStore.getState().resetGame();

      suppressSetupModalUntilNewGame();

      onComplete?.();

      dismissAuthGate();

      navigateToMatchSummary({
        fixtureId: abandonedFixture.id,
      });

      console.log(
        "🟠 Fixture abandoned and saved successfully:",
        abandonedFixture.id,
      );
    } catch (err) {
      console.error("❌ Error in handleAbandonMatch:", err);
      throw err;
    }
  };

  /* ======================== END GAME WITHOUT SAVE ======================== */
  const handleEndGameNoSave = async () => {
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

    suppressSetupModalUntilNewGame();

    onComplete?.();

    navigateToMatchSummary({
      fixtureId: fixtureSnapshot.id,
      prevMode: modeAtTimeOfReset,
    });
  };

  return (
    <View>
      {/* END INNINGS BUTTON */}
      <Button
        mode="contained"
        onPress={() => setVisible(true)}
        style={styles.button}
        labelStyle={styles.buttonLabel}
        // Paper handles icon names directly if wrapped in your provider,
        // or you can pass a cleaner function definition like this:
        icon={({ size, color }) => (
          <Icon name="flag-checkered" size={20} color="#c471ed" />
        )}
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
                disabled={isSaving}
                loading={isSaving}
                onPress={() => void runProtectedSaveAction(handleEndGame)}
                style={styles.primaryAction}
                labelStyle={{ color: "#fff" }}
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
                    disabled={isSaving}
                    loading={isSaving}
                    onPress={() => void runProtectedSaveAction(handleAbandonMatch)}
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

      <AuthModal
        visible={authVisible}
        onClose={() => {
          // Only treat as cancel — guest/login success resumes via useRequireAuth
          if (!auth.currentUser && !useAuthStore.getState().isGuest) {
            dismissAuthGate();
            clearSavingState();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ffffff",
    marginVertical: 12, // Combines top and bottom margins uniformly
    marginHorizontal: 4, // Matches the side alignment of your cards
    borderRadius: 8, // Matches the exact corner radius of the Paper Cards
    elevation: 2, // Adds a subtle Material elevation shadow to pop off the screen
  },
  buttonLabel: {
    color: "#c471ed", // Rich purple text to match your icon color
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 4, // Clean vertical breathing room handled safely on the text layer
    textTransform: "uppercase", // Gives it a clean, official sports UI feel
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
