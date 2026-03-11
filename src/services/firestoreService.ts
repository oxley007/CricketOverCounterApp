import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Fixture } from "../state/fixtureStore";
import { Player, Team } from "../state/teamStore";
import { auth, db } from "./firebaseConfig";

function cleanForFirestore(obj: any): any {
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)]),
    );
  }

  return obj;
}

export async function saveFixture(fixture: any): Promise<void> {
  if (!auth.currentUser) {
    // Guest / signed-out users don't get cloud backup; silently no-op
    return;
  }

  const userId = auth.currentUser.uid;
  const fixtureId = fixture.id || Date.now().toString();

  try {
    await setDoc(
      doc(db, "users", userId, "fixtures", fixtureId),
      cleanForFirestore({
        ...fixture,
        savedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    console.log("✅ Fixture saved:", fixtureId);
  } catch (err) {
    console.error("❌ Error saving fixture:", err);
    throw err;
  }
}

export async function saveTeam(team: any): Promise<void> {
  if (!auth.currentUser) {
    // Guest / signed-out users don't get cloud backup; silently no-op
    return;
  }

  const userId = auth.currentUser.uid;

  try {
    await setDoc(
      doc(db, "users", userId, "teams", team.id),
      cleanForFirestore({
        ...team,
        savedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    console.log("✅ Team saved:", team.name);
  } catch (err) {
    console.error("❌ Error saving team:", err);
    throw err;
  }
}

export async function savePlayer(teamId: string, player: any): Promise<void> {
  if (!auth.currentUser) {
    // Guest / signed-out users don't get cloud backup; silently no-op
    return;
  }

  const userId = auth.currentUser.uid;

  try {
    await setDoc(
      doc(db, "users", userId, "teams", teamId, "players", player.id),
      cleanForFirestore({
        ...player,
        savedAt: serverTimestamp(),
      }),
      { merge: true },
    );

    console.log("✅ Player saved:", player.name);
  } catch (err) {
    console.error("❌ Error saving player:", err);
    throw err;
  }
}

/** Saves a team and all its players to Firestore. No-op if not authenticated. */
export async function saveTeamWithPlayers(team: Team): Promise<void> {
  await saveTeam(team);

  await Promise.all(
    (team.players ?? []).map(async (player) => {
      try {
        await savePlayer(team.id, player);
      } catch (err) {
        console.warn("⚠️ Failed to save player:", player.name, err);
      }
    }),
  );
}

export async function loadFixtures(): Promise<Fixture[]> {
  if (!auth.currentUser) return [];

  const userId = auth.currentUser.uid;
  const snapshot = await getDocs(collection(db, "users", userId, "fixtures"));

  // Map DocumentData -> Fixture
  return snapshot.docs.map((doc) => {
    const data = doc.data();

    // Ensure required fields exist
    return {
      id: doc.id,
      date: data.date ?? Date.now(),
      season: data.season,
      yourTeam: data.yourTeam ?? { id: "", name: "" },
      oppositionTeam: data.oppositionTeam ?? { id: "", name: "" },
      overs: data.overs ?? 0,
      innings: data.innings ?? [],
      abandoned: data.abandoned ?? false,
      result: data.result,
      completed: data.completed ?? false,
    } as Fixture;
  });
}

// firestoreService.ts (loadTeams)
export async function loadTeams(): Promise<Team[]> {
  if (!auth.currentUser) return [];

  const userId = auth.currentUser.uid;
  const teamSnapshot = await getDocs(collection(db, "users", userId, "teams"));

  const teams: Team[] = [];

  for (const teamDoc of teamSnapshot.docs) {
    const teamData = teamDoc.data();

    const playersSnapshot = await getDocs(
      collection(db, "users", userId, "teams", teamDoc.id, "players"),
    );

    const players: Player[] = playersSnapshot.docs.map((p) => {
      const pdata = p.data();
      return {
        id: p.id,
        name: pdata.name ?? "Unknown",
        archived: pdata.archived ?? false,
      };
    });

    teams.push({
      id: teamDoc.id,
      name: teamData.name ?? "Unknown",
      players,
    });
  }

  return teams;
}

function mergeById(local: any[], remote: any[]) {
  const map = new Map();

  [...remote, ...local].forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
}

/** Reads proUnlocked from the user doc in Firestore (e.g. for sync on login). */
export async function loadUserSubscription(): Promise<boolean> {
  if (!auth.currentUser) return false;

  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data()?.proUnlocked ?? false) : false;
  } catch (err) {
    console.warn("Failed to load subscription from Firestore:", err);
    return false;
  }
}

export async function saveSubscription(isPro: boolean) {
  if (!auth.currentUser) return;

  const userId = auth.currentUser.uid;

  try {
    await setDoc(
      doc(db, "users", userId),
      {
        proUnlocked: isPro,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log("✅ Subscription state saved:", isPro);
  } catch (err) {
    console.error("❌ Error saving subscription:", err);
  }
}

export { mergeById };
