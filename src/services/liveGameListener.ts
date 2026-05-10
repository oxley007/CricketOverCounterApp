import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useFixtureStore } from "../state/fixtureStore";
import { getTeamCode } from "../utils/liveHelpers";
import { useLiveStore } from "../state/liveStore";

const listeners: Record<string, () => void> = {};

export function startLiveGameListener(teamId: string) {
  const teamCode = getTeamCode(teamId);

  // avoid duplicate listener
  if (listeners[teamCode]) return;

  const ref = doc(db, "publicTeams", teamCode, "liveData", "currentFixture");

  const unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;

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

    //useFixtureStore.getState().setCurrentFixture(mappedFixture);
    useLiveStore.getState().setFixture(teamCode, mappedFixture);
  });

  listeners[teamCode] = unsubscribe;
}

export function stopLiveGameListener(teamId?: string) {
  if (teamId) {
    const teamCode = getTeamCode(teamId);

    listeners[teamCode]?.();
    delete listeners[teamCode];
    return;
  }

  // stop all
  Object.values(listeners).forEach((unsub) => unsub());
  Object.keys(listeners).forEach((key) => delete listeners[key]);
}
