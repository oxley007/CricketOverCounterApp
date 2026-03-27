// syncUserData.ts
import { Fixture, useFixtureStore } from "../state/fixtureStore";
import { useMatchStore } from "../state/matchStore";
import { Team, useTeamStore } from "../state/teamStore";
import { deepMergeById } from "./firestoreMerge";
import {
  loadFixtures,
  loadSeason,
  loadTeams,
  loadUserSubscription,
} from "./firestoreService";

export async function syncUserData() {
  try {
    const fixtureStore = useFixtureStore.getState();
    const teamStore = useTeamStore.getState();

    // 1️⃣ Load remote data
    const remoteFixtures: Fixture[] = await loadFixtures();
    const remoteTeams: Team[] = await loadTeams();
    const proUnlocked = await loadUserSubscription();
    const currentSeason = await loadSeason();

    // 2️⃣ Merge remote into local — local wins on conflicts
    // NEW: local wins on conflicts (local = existing local, remote = cloud)
    const mergedFixtures: Fixture[] = deepMergeById(
      fixtureStore.fixtures,
      remoteFixtures,
    );
    const mergedTeams: Team[] = deepMergeById(teamStore.teams, remoteTeams);

    // 3️⃣ Update local stores
    useFixtureStore.setState({ fixtures: mergedFixtures });
    useTeamStore.setState({ teams: mergedTeams });
    useMatchStore.getState().setProUnlocked(proUnlocked);

    if (currentSeason) {
      useMatchStore.getState().setSeason(currentSeason); // optional if matchStore tracks it
    }

    console.log(
      "✅ User data synced — fixtures, teams, and subscription merged",
    );
  } catch (err) {
    console.error("❌ Error syncing user data:", err);
  }
}
