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
import { getAllFixtures, initDB, saveMultipleFixtures } from "./sqliteService";

export async function syncUserData() {
  try {
    const teamStore = useTeamStore.getState();
    const matchStore = useMatchStore.getState();

    // 1️⃣ Load remote data
    const remoteFixtures: Fixture[] = await loadFixtures();
    const remoteTeams: Team[] = await loadTeams();
    //const proUnlocked = await loadUserSubscription();
    const subscription = await loadUserSubscription();

    if (matchStore.proUnlocked !== subscription.ballPro) {
      matchStore.setProUnlocked(subscription.ballPro);
    }

    if (matchStore.proUnlockedScorebook !== subscription.scorebookPro) {
      matchStore.setProUnlockedScorebook(subscription.scorebookPro);
    }
    const currentSeason = await loadSeason();

    await initDB();
    const localFixtures = await getAllFixtures();

    // 2️⃣ Merge
    const mergedFixtures: Fixture[] = deepMergeById(
      localFixtures,
      remoteFixtures,
    );

    const mergedTeams: Team[] = deepMergeById(teamStore.teams, remoteTeams);

    // 3️⃣ ONLY update if changed ✅
    if (!isEqual(localFixtures, mergedFixtures)) {
      await saveMultipleFixtures(mergedFixtures);
      useFixtureStore.setState((state) => ({
        fixturesRevision: state.fixturesRevision + 1,
      }));
    }

    if (!isEqual(teamStore.teams, mergedTeams)) {
      useTeamStore.setState({ teams: mergedTeams });
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
