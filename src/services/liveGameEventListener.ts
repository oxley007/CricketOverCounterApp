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

// Store unsubs by teamCode
const activeListeners: Record<string, () => void> = {};

export function startLiveGameEventListener(teamId: string) {
  const isLiveViewer = useLiveStore.getState().isReadOnly;

  if (isLiveViewer) {
    const teamCode = getTeamCode(teamId);
    if (activeListeners[teamCode]) return;

    console.log("📡 Starting Live Sync for:", teamCode);

    // 1. Listen to currentFixture (Document)
    const unsubFixture = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentFixture"),
      (snap) => {
        if (snap.exists()) {
          console.log(
            useLiveStore.getState().isReadOnly,
            " useLiveStore.getState().isReadOnly is what?  1",
          );
          if (!useLiveStore.getState().isReadOnly) return;

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

    // 2. Listen to currentBaseRuns (Document)
    const unsubBaseRuns = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentBaseRuns"),
      (snap) => {
        if (!snap.exists()) return;

        console.log(
          useLiveStore.getState().isReadOnly,
          " useLiveStore.getState().isReadOnly is what?  2",
        );
        // 🛑 HARD GUARD (prevents stale listener updates)
        if (!useLiveStore.getState().isReadOnly) return;

        useMatchStore.getState().setBaseRuns(snap.data().runs || 0);
      },
    );

    // 3. Listen to currentGame (Document)
    const unsubGame = onSnapshot(
      doc(db, "publicTeams", teamCode, "liveData", "currentGame"),
      (snap) => {
        if (!snap.exists()) return;

        console.log(
          useLiveStore.getState().isReadOnly,
          " useLiveStore.getState().isReadOnly is what?  3",
        );
        // 🛑 HARD GUARD
        if (!useLiveStore.getState().isReadOnly) return;

        useGameStore.getState().setCurrentGame(snap.data() as any);
      },
    );

    // 4. Listen to match events (Collection)
    const eventsQuery = query(
      collection(db, "publicTeams", teamCode, "live"),
      orderBy("timestamp", "asc"),
    );

    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      console.log(
        useLiveStore.getState().isReadOnly,
        " useLiveStore.getState().isReadOnly is what?",
      );

      if (!useLiveStore.getState().isReadOnly) return;

      const events = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      useMatchStore.getState().setMatchEvents(events as any);
    });

    // Combine all unsubs into one cleanup function
    activeListeners[teamCode] = () => {
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
  } else {
    // Stop all
    Object.keys(activeListeners).forEach((code) => {
      activeListeners[code]();
      delete activeListeners[code];
    });
  }
}
