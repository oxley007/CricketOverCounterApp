import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useFixtureStore } from "../state/fixtureStore";
import { getTeamCode } from "../utils/liveHelpers";
import { useLiveStore } from "../state/liveStore";
import { useMatchStore } from "../state/matchStore";
import * as Sentry from "@sentry/react-native";

// Store grouped unsubs by teamCode instead of just single unsubs
const listeners: Record<string, () => void> = {};
const lastSyncedOverTracker: Record<string, number> = {};
const activeListeners: Record<string, () => void> = {};

export function startLiveGameListener(teamId: string) {
  const teamCode = getTeamCode(teamId);

  Sentry.addBreadcrumb({
    category: "live-sync",
    message: "startLiveGameEventListener",
    level: "info",
    data: {
      teamCode,
      alreadyActive: !!activeListeners[teamCode],
    },
  });

  console.log(teamCode, " teamCode in her is wha?");

  // avoid duplicate listener
  if (listeners[teamCode]) return;

  console.log("📡 Starting Live Fixture Listener for:", teamCode);
  let remoteProLive = false;
  let allowDataUpdates = false;
  lastSyncedOverTracker[teamCode] = -1;

  // Premium access bridge check
  const isProLiveUnlocked = () => {
    const localViewerPro = useLiveStore.getState().liveProViewer; // 🚀 Read supporter state
    return localViewerPro || remoteProLive;
  };

  // 1. Listen to the Root Document for team-level proLive upgrades
  // 1. Listen to the Root Document for team-level proLive upgrades
  const unsubRootTeam = onSnapshot(doc(db, "publicTeams", teamCode), (snap) => {
    if (snap.exists()) {
      const isTeamPro = snap.data()?.proLive ?? false;
      remoteProLive = isTeamPro;

      // 🚀 CRITICAL UI FIX: Sync this state directly into your Zustand store
      // so your UI re-renders immediately and hides the locked card!
      useLiveStore.getState().setLivePro(isTeamPro);
    }
  });

  // 2. Listen to SyncControl to gate update permissions for free users
  const unsubControl = onSnapshot(
    doc(db, "publicTeams", teamCode, "liveData", "syncControl"),
    (snap) => {
      if (!snap.exists()) {
        allowDataUpdates = true; // Fallback
        return;
      }

      const control = snap.data();
      const over = control.completedOvers ?? 0;
      const isGameComplete = control.isCompleted ?? false;

      if (isProLiveUnlocked()) {
        allowDataUpdates = true;
        return;
      }

      // Free user gating matching your exact limits
      if (isGameComplete) {
        allowDataUpdates = true;
      } else if (
        over > 0 &&
        over % 2 === 0 &&
        over !== lastSyncedOverTracker[teamCode]
      ) {
        lastSyncedOverTracker[teamCode] = over;
        allowDataUpdates = true;
        console.log(`🔓 Fixture Sync Gate Open for Over: ${over}`);
      } else {
        allowDataUpdates = false;
      }
    },
  );

  // 3. Main Document Listener (The one being throttled)
  const ref = doc(db, "publicTeams", teamCode, "liveData", "currentFixture");
  const unsubscribeFixture = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;

    // 🛑 Throttling guard condition logic clause
    if (!allowDataUpdates && !isProLiveUnlocked()) return;

    const data = snap.data();

    const mappedFixture = {
      id: data.fixtureId,
      date: data.date ?? Date.now(),
      season: data.season,
      yourTeam: data.yourTeam ?? { id: teamId, name: "" },
      oppositionTeam: data.oppositionTeam ?? { id: "", name: "" },
      overs: data.overs ?? 0,
      innings: data.innings ?? [],
      completed: data.completed ?? false,
    };

    useLiveStore.getState().setFixture(teamCode, mappedFixture);
  });

  // 4. Real-time Teams Subcollection Listener
  const teamsCollectionRef = collection(db, "publicTeams", teamCode, "teams");
  const unsubscribeTeams = onSnapshot(teamsCollectionRef, (snapshot) => {
    const teamCode = getTeamCode(teamId);

    // 🚀 DEBUG LOGS: Check these in your browser console!
    console.log("🔍 [DEBUG] startLiveGameListener input teamId:", teamId);
    console.log("🔍 [DEBUG] Derived teamCode string:", teamCode);
    console.log(
      `📡 Full Firestore Target Path: publicTeams / ${teamCode} / teams`,
    );
    const updatedTeams = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Fallback logic to read exactly what is in your screenshot
      const playersArray = Array.isArray(data.players) ? data.players : [];

      return {
        id: data.teamId || doc.id,
        name: data.teamName || "Unnamed Team",
        players: playersArray.map((p: any) => ({
          id: p?.id || "",
          name: p?.name || "Unknown Player",
          archived: p?.archived ?? false,
        })),
      } as unknown as Team;
    });

    console.log("📡 Real-time teams payload incoming:", updatedTeams);
    useLiveStore.getState().setLiveViewTeams(updatedTeams);
  });

  // 5. Baseruns Document Listener
  const baserunsRef = doc(
    db,
    "publicTeams",
    teamCode,
    "liveData",
    "currentBaseRuns",
  );
  const unsubscribeBaseruns = onSnapshot(baserunsRef, (snap) => {
    console.log(
      `📡 TARGET BASE RUNS PATH: publicTeams/${teamCode}/liveData/currentBaseRuns`,
    );
    if (!snap.exists()) return;

    // Optional: Keep your same pro-user/sync gating logic
    if (!allowDataUpdates && !isProLiveUnlocked()) return;

    const data = snap.data();

    // Extract baseRuns, falling back to the 'value' field or 0 if empty
    const runsCount = data.baseRuns ?? data.value ?? 0;

    // Sync to your Zustand store matching its single-argument signature
    useMatchStore.getState().setBaseRuns(runsCount);

    console.log("⚾ CurrentBaseruns synchronized:", {
      runs: runsCount,
      updatedAt: data.updatedAt,
    });
  });

  // Combine all 3 cleanup operations under this team code key
  listeners[teamCode] = () => {
    unsubRootTeam();
    unsubControl();
    unsubscribeFixture();
    unsubscribeTeams();
    unsubscribeBaseruns();
  };
}

export function stopLiveGameListener(teamId?: string) {
  Sentry.addBreadcrumb({
    category: "live-sync",
    message: "stopLiveGameEventListener",
    level: "info",
    data: {
      teamId,
    },
  });
  if (teamId) {
    const teamCode = getTeamCode(teamId);

    listeners[teamCode]?.();
    delete listeners[teamCode];
    delete lastSyncedOverTracker[teamCode];
    return;
  }

  // stop all
  Object.values(listeners).forEach((unsub) => unsub());
  Object.keys(listeners).forEach((key) => delete listeners[key]);
  Object.keys(lastSyncedOverTracker).forEach(
    (key) => delete lastSyncedOverTracker[key],
  );
}
