// src/services/fixtureSyncService.ts
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useLiveStore } from "../state/liveStore";
import { useFixtureStore } from "../state/fixtureStore";
import { getTeamCode } from "../utils/liveHelpers";

export function listenAndMergeFixture(teamIdOrCode: string) {
  const teamCode = getTeamCode(teamIdOrCode);

  // 1. Point to the entire 'fixtures' subcollection
  const fixturesRef = collection(db, "publicTeams", teamCode, "fixtures");
  const teamRef = doc(db, "publicTeams", teamCode);

  // Keep your existing team name fetcher
  (async () => {
    try {
      const snap = await getDoc(teamRef);
      if (snap.exists() && snap.data().teamName) {
        useLiveStore
          .getState()
          .updateSupporterTeamName(teamCode, snap.data().teamName);
      }
    } catch (e) {
      console.warn("Error fetching team name:", e);
    }
  })();

  // 2. Return a listener for the whole collection
  return onSnapshot(fixturesRef, (querySnap) => {
    if (querySnap.empty) {
      console.log(`No fixtures found in /fixtures for ${teamCode}`);
      return;
    }

    querySnap.forEach((docSnap) => {
      const data = docSnap.data();

      // Use the document ID or a provided fixtureId field
      const fixtureId = data.fixtureId || docSnap.id;

      const mappedFixture = {
        id: fixtureId,
        date: data.date?.toMillis
          ? data.date.toMillis()
          : (data.date ?? Date.now()),
        season: data.season || "Unknown",
        yourTeam: data.yourTeam ?? {
          id: data.teamId || teamCode,
          name: data.teamName || "",
        },
        oppositionTeam: data.oppositionTeam ?? { id: "", name: "" },
        overs: data.overs ?? 0,
        innings: data.innings ?? [],
        completed: !!data.completed,
        result: data.result || undefined,
        savedAt: data.savedAt?.toMillis ? data.savedAt.toMillis() : Date.now(),
      };

      // Upsert each one into the store
      useFixtureStore.getState().upsertFixture(mappedFixture);
    });
  });
}
