import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getTeamCode } from "../utils/liveHelpers";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { useGameStore } from "../state/gameStore";
import { useLiveStore } from "../state/liveStore";

const activeListeners: Record<string, () => void> = {};
const lastSyncedOverTracker: Record<string, number> = {};

export function startLiveGameEventListener(teamId: string) {
  const isLiveViewer = useLiveStore.getState().isReadOnly;

  if (isLiveViewer) {
    const teamCode = getTeamCode(teamId);
    if (activeListeners[teamCode]) return;

    console.log("📡 Starting Live Sync for:", teamCode);
    let remoteProLive = false;

    // This state flag changes dynamically based on syncControl data incoming feeds
    let allowDataUpdates = false;
    lastSyncedOverTracker[teamCode] = -1;

    const isProLiveUnlocked = () => {
      const localViewerPro = useLiveStore.getState().liveProViewer; // 🚀 Read supporter state
      return localViewerPro || remoteProLive; // Remote match-level pro status or viewer's custom tier pass
    };

    // A. Listen to the Root Document to safely read remote proLive status changes live
    const unsubRootTeam = onSnapshot(
      doc(db, "publicTeams", teamCode),
      (snap) => {
        if (snap.exists()) {
          remoteProLive = snap.data()?.proLive ?? false;
        }
      },
    );

    // 🚀 B. New SyncControl Listener: Decides if free users pull content
    const unsubControl = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "syncControl"),
      (snap) => {
        if (!snap.exists()) {
          allowDataUpdates = true; // Fallback if scorer hasn't pushed meta
          return;
        }

        const control = snap.data();
        const over = control.completedOvers ?? 0;
        const isGameComplete = control.isCompleted ?? false;

        // Pro subscribers skip filtering completely
        if (isProLiveUnlocked()) {
          allowDataUpdates = true;
          return;
        }

        // Free User Rules Evaluation:
        if (isGameComplete) {
          allowDataUpdates = true;
        } else if (
          over > 0 &&
          over % 2 === 0 &&
          over !== lastSyncedOverTracker[teamCode]
        ) {
          // Triggers update exactly when an even over completes (2.0, 4.0, etc.)
          lastSyncedOverTracker[teamCode] = over;
          allowDataUpdates = true;
          console.log(`🔓 Free Sync Gate Open for Over: ${over}`);
        } else {
          // Lock down state stores until rules match
          allowDataUpdates = false;
        }
      },
    );

    // C. Listen to currentFixture (Document)
    const unsubFixture = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentFixture"),
      (snap) => {
        if (snap.exists() && useLiveStore.getState().isReadOnly) {
          // Gate block evaluation
          if (!allowDataUpdates && !isProLiveUnlocked()) return;

          const snapData = snap.data() as any;
          const current = useFixtureStore.getState().currentFixture;
          useFixtureStore.getState().setCurrentFixture({
            ...current,
            ...snapData,
            innings: snapData.innings ?? current?.innings ?? [],
          });
        }
      },
    );

    // D. Listen to currentBaseRuns (Document)
    const unsubBaseRuns = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentBaseRuns"),
      (snap) => {
        if (snap.exists() && useLiveStore.getState().isReadOnly) {
          if (!allowDataUpdates && !isProLiveUnlocked()) return;
          useMatchStore.getState().setBaseRuns(snap.data().runs || 0);
        }
      },
    );

    // E. Listen to currentGame (Document)
    const unsubGame = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentGame"),
      (snap) => {
        if (snap.exists() && useLiveStore.getState().isReadOnly) {
          if (!allowDataUpdates && !isProLiveUnlocked()) return;
          useGameStore.getState().setCurrentGame(snap.data() as any);
        }
      },
    );

    // F. Listen to match events (Collection)
    const eventsQuery = query(
      collection(db, "publicTeams", teamCode, "live"),
      orderBy("timestamp", "asc"),
    );
    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      if (useLiveStore.getState().isReadOnly) {
        if (!allowDataUpdates && !isProLiveUnlocked()) return;

        const events = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        useMatchStore.getState().setMatchEvents(events as any);
      }
    });

    activeListeners[teamCode] = () => {
      unsubRootTeam();
      unsubControl();
      unsubFixture();
      unsubBaseRuns();
      unsubGame();
      unsubEvents();
    };
  }
}

export function stopLiveGameEventListener(teamId?: string) {
  if (teamId) {
    const teamCode = getTeamCode(teamId);
    activeListeners[teamCode]?.();
    delete activeListeners[teamCode];
    delete lastSyncedOverTracker[teamCode];
  } else {
    // Stop all background tracking listeners globally
    Object.keys(activeListeners).forEach((code) => {
      activeListeners[code]();
      delete activeListeners[code];
      delete lastSyncedOverTracker[code];
    });
  }
}
