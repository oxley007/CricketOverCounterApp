// syncUserData.ts
import isEqual from "fast-deep-equal";
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
    const matchStore = useMatchStore.getState();

    // 1️⃣ Load remote data
    const remoteFixtures: Fixture[] = await loadFixtures();
    const remoteTeams: Team[] = await loadTeams();
    const proUnlocked = await loadUserSubscription();
    const currentSeason = await loadSeason();

    // 2️⃣ Merge
    const mergedFixtures: Fixture[] = deepMergeById(
      fixtureStore.fixtures,
      remoteFixtures,
    );

    const mergedTeams: Team[] = deepMergeById(teamStore.teams, remoteTeams);

    // 3️⃣ ONLY update if changed ✅
    if (!isEqual(fixtureStore.fixtures, mergedFixtures)) {
      useFixtureStore.setState({ fixtures: mergedFixtures });
    }

    if (!isEqual(teamStore.teams, mergedTeams)) {
      useTeamStore.setState({ teams: mergedTeams });
    }

    if (matchStore.proUnlocked !== proUnlocked) {
      matchStore.setProUnlocked(proUnlocked);
    }

    if (currentSeason && matchStore.season !== currentSeason) {
      matchStore.setSeason(currentSeason);
    }

    console.log(
      "✅ User data synced — fixtures, teams, and subscription merged",
    );
  } catch (err) {
    console.error("❌ Error syncing user data:", err);
  }
}
