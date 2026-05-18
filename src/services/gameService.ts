// services/gameService.ts
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { useGameStore } from "../state/gameStore";
import { getTeamCode } from "../utils/liveHelpers";
import { router } from "expo-router";
import { loadLiveViewTeams } from "./firestoreService";
import { useLiveStore } from "../state/liveStore";

export async function resumeLiveGame(teamId: string) {
  try {
    const teamCode = getTeamCode(teamId);

    // 1. Define references
    const liveDataRef = collection(db, "publicTeams", teamCode, "liveData");
    const matchEventsRef = collection(db, "publicTeams", teamCode, "live");

    // 2. Fetch both collections in parallel for speed
    const [liveDataSnap, matchEventsSnap] = await Promise.all([
      getDocs(liveDataRef),
      getDocs(query(matchEventsRef, orderBy("timestamp", "asc"))), // Assuming you want them in order
    ]);

    // 3. Handle Live Data (3 core documents)
    let fixtureData = null;
    let baseRuns = 0;
    let gameData = null;

    liveDataSnap.forEach((doc) => {
      const id = doc.id;
      const data = doc.data();
      if (id === "currentFixture") fixtureData = data;
      if (id === "currentBaseRuns") baseRuns = data.runs || 0;
      if (id === "currentGame") gameData = data;
    });

    if (!fixtureData || !gameData) throw new Error("Incomplete game data");

    // 4. Handle Match Events (Array of documents)
    const events = matchEventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 5. Update All Stores
    useFixtureStore.getState().setCurrentFixture(fixtureData);
    useMatchStore.getState().setBaseRuns(baseRuns);
    useGameStore.getState().setCurrentGame(gameData);

    // Assuming your matchStore has a setMatchEvents or similar action
    useMatchStore.getState().setMatchEvents(events);

    console.log(JSON.stringify(gameData), "checking gameData here.");

    // Set the game configuration using data from gameData
    useGameStore.getState().setGameConfig({
      yourTeam: {
        id: gameData.yourTeam?.id,
        name: gameData.yourTeam?.name,
      },
      oppositionTeam: {
        id: gameData.oppositionTeam?.id,
        name: gameData.oppositionTeam?.name,
      },
      overs: gameData.overs,
      season: gameData.season,
    });

    const liveTeams = await loadLiveViewTeams(teamId);

    const normalizedTeams = liveTeams.map((team) => ({
      id: team.teamId,
      name: team.teamName,
      players: team.players ?? [],
    }));

    useLiveStore.getState().setLiveViewTeams(normalizedTeams);

    console.log(JSON.stringify(normalizedTeams), "loaded live teams");

    // 6. Route
    const mode = fixtureData.mode;
    if (mode === "ballCounter") router.replace("/ball-counter");
    else if (mode === "scorebook") router.replace("/scorebook");
    else throw new Error(`Unknown mode: ${mode}`);
  } catch (error) {
    console.error("Resume Error:", error);
    throw error;
  }
}
