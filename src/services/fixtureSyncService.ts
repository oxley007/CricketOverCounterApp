// src/services/fixtureSyncService.ts
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useLiveStore } from "../state/liveStore";
import { useFixtureStore } from "../state/fixtureStore";
import { getTeamCode } from "../utils/liveHelpers";

export function listenAndMergeFixture(teamIdOrCode: string) {
  const teamCode = getTeamCode(teamIdOrCode);
  const fixturesRef = collection(db, "publicTeams", teamCode, "fixtures");
  const teamRef = doc(db, "publicTeams", teamCode);

  // Keep your team name fetcher intact...
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

  // 🚀 REAL-TIME BUNDLED SNAPSHOT
  return onSnapshot(fixturesRef, (querySnap) => {
    if (querySnap.empty) {
      console.log(`No fixtures found in /fixtures for ${teamCode}`);
      return;
    }

    // 1. Map all documents out into an array bundle first
    const updatedFixturesList = querySnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const fixtureId = data.fixtureId || docSnap.id;

      return {
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
    });

    console.log(
      `📡 [MERGE] Received ${updatedFixturesList.length} fixtures from live stream.`,
    );

    // 2. Fire ONE single bulk action to update your state cleanly
    useFixtureStore.getState().upsertBulkFixtures(updatedFixturesList);
  });
}
