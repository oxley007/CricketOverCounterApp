import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useFixtureStore } from "../state/fixtureStore";
import { getTeamCode } from "../utils/liveHelpers";
import { useLiveStore } from "../state/liveStore";

// Store grouped unsubs by teamCode instead of just single unsubs
const listeners: Record<string, () => void> = {};
const lastSyncedOverTracker: Record<string, number> = {};

export function startLiveGameListener(teamId: string) {
  const teamCode = getTeamCode(teamId);

  // avoid duplicate listener
  if (listeners[teamCode]) return;

  console.log("📡 Starting Live Fixture Listener for:", teamCode);
  let remoteProLive = false;
  let allowDataUpdates = false;
  lastSyncedOverTracker[teamCode] = -1;

  // Premium access bridge check
  const isProLiveUnlocked = () => {
    return useLiveStore.getState().livePro || remoteProLive;
  };

  // 1. Listen to the Root Document for team-level proLive upgrades
  const unsubRootTeam = onSnapshot(doc(db, "publicTeams", teamCode), (snap) => {
    if (snap.exists()) {
      remoteProLive = snap.data()?.proLive ?? false;
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

  // Combine all 3 cleanup operations under this team code key
  listeners[teamCode] = () => {
    unsubRootTeam();
    unsubControl();
    unsubscribeFixture();
  };
}

export function stopLiveGameListener(teamId?: string) {
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
