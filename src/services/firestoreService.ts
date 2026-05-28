import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { Fixture } from "../state/fixtureStore";
import { Player, Team } from "../state/teamStore";
import { auth, db } from "./firebaseConfig";
import { getTeamCode } from "../utils/liveHelpers";
import { useLiveStore } from "../state/liveStore";

let lastSyncHash: string | null = null;

// 1. Global helper check
function isLiveConfigured(): boolean {
  return useLiveStore.getState().liveConfigured;
}

function stripVolatileFields(game: any) {
  const copy = { ...game };
  delete copy.updatedAt;
  return copy;
}

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

function removeUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined),
  );
}

async function writeLiveData(
  teamId: string,
  docName: "currentFixture" | "currentGame" | "currentBaseRuns",
  data: any,
) {
  if (!isLiveConfigured()) {
    console.log(`⚠️ Sync skipped for ${docName}: liveConfigured is false.`);
    return;
  }

  // 🔐 Prevent logged-out users from writing live state
  if (!auth.currentUser?.uid) return;

  if (!data || typeof data !== "object") {
    console.warn("❌ writeLiveData expects an object, got:", data);
    return;
  }

  const teamCode = getTeamCode(teamId);

  const ref = doc(db, "publicTeams", teamCode, "liveData", docName);

  await setDoc(
    ref,
    {
      ...cleanForFirestore(data),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`📡 Live data updated (${docName}):`, teamCode);
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
export async function loadUserSubscription(): Promise<{
  ballPro: boolean;
  scorebookPro: boolean;
}> {
  if (!auth.currentUser) return { ballPro: false, scorebookPro: false };

  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return { ballPro: false, scorebookPro: false };
    }

    return (
      snap.data()?.subscriptions ?? {
        ballPro: false,
        scorebookPro: false,
      }
    );
  } catch (err) {
    console.warn("Failed to load subscription from Firestore:", err);
    return { ballPro: false, scorebookPro: false };
  }
}

// 🚀 Update the type definition to accept the new live properties
export type SubscriptionStatus = {
  ballPro: boolean;
  scorebookPro: boolean;
  livePro?: boolean; // 👈 Added optional fields
  liveProViewer?: boolean; // 👈 Added optional fields
};

export async function saveSubscription(subscription: SubscriptionStatus) {
  if (!auth.currentUser) return;

  const userId = auth.currentUser.uid;

  try {
    await setDoc(
      doc(db, "users", userId),
      {
        subscriptions: subscription,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log("✅ Subscription state saved:", subscription);
  } catch (err) {
    console.error("❌ Error saving subscription:", err);
  }
}

/** firestoreService.ts */

/** Saves the last season to the user doc */
export async function saveSeason(season: string): Promise<void> {
  if (!auth.currentUser) return;

  const userId = auth.currentUser.uid;

  try {
    await setDoc(
      doc(db, "users", userId),
      { lastSeason: season, updatedAt: serverTimestamp() },
      { merge: true },
    );

    console.log("✅ Season saved:", season);
  } catch (err) {
    console.error("❌ Error saving season:", err);
  }
}

export async function createPublicTeam(
  team: Team,
  fixtures: any[],
  liveEvents: any[],
) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for createPublicTeam: liveConfigured is false.`,
    );
    return;
  }
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const isProLiveActive = useLiveStore.getState().livePro ?? false;

  const teamCode = `TEAM-${team.id.toUpperCase()}`;
  try {
    const teamRef = doc(db, "publicTeams", teamCode);
    console.log("🔥 teamCode being written:", teamCode);

    // 1. Parent Team - Using merge ensures we don't accidentally blow away other root fields
    await setDoc(
      teamRef,
      {
        ownerId: userId,
        teamId: team.id,
        teamName: team.name,
        createdAt: serverTimestamp(),
        teamCode,
        proLive: isProLiveActive,
      },
      { merge: true },
    );

    // 2. Write Team Players - Cleaned and Merged
    // 2. Write Team Players - Added (team.players ?? []) safeguard
    await Promise.all(
      (team.players ?? []).map((p) =>
        setDoc(
          doc(teamRef, "teamData", p.id),
          cleanForFirestore({
            playerId: p.id,
            name: p.name,
          }),
          { merge: true },
        ),
      ),
    );

    const testSnap = await getDocs(collection(teamRef, "teamData"));
    console.log("🧪 teamData count:", testSnap.size);

    // 3. Fixtures - WRAPPED with cleanForFirestore to strip out the undefined fields!
    await Promise.all(
      fixtures.map(
        (f) =>
          setDoc(
            doc(teamRef, "fixtures", f.id),
            cleanForFirestore({
              ...f,
              updatedAt: serverTimestamp(),
            }),
            { merge: true },
          ), // ✅ Added merge to prevent loss of remote fields
      ),
    );

    // 4. Live match events
    await Promise.all(
      liveEvents.map((e) =>
        setDoc(
          doc(teamRef, "live", e.id),
          cleanForFirestore({
            // ✅ Standardized to cleanForFirestore
            ...e,
            teamCode,
            teamId: team.id,
            createdAt: serverTimestamp(),
          }),
          { merge: true },
        ),
      ),
    );

    console.log(
      "✅ Public team created cleanly with fixtures + live:",
      teamCode,
    );
    return teamCode;
  } catch (err) {
    console.error("❌ Failed to create public team:", err);
    return null;
  }
}

export async function clearLiveEvents(teamCodeRaw: string) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for clearLiveEvents: liveConfigured is false.`,
    );
    return;
  }

  // 🔐 Prevent logged-out users from making Firebase calls
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.log("ℹ️ Local play: clearLiveEvents skipped (no user).");
    return;
  }
  //const teamCode = `TEAM-${teamCodeRaw.toUpperCase()}`;
  const teamCode = getTeamCode(teamCodeRaw);

  const liveRef = collection(db, "publicTeams", teamCode, "live");

  const snapshot = await getDocs(liveRef);

  const batch = writeBatch(db);

  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();

  console.log("🧹 Cleared live events for team:", teamCode);
}

/**
 * Explicitly updates the proLive status of an existing active public team
 */
export async function updatePublicTeamProStatus(
  teamId: string,
  isProLive: boolean,
) {
  try {
    const teamCode = `TEAM-${teamId.toUpperCase()}`;
    const teamRef = doc(db, "publicTeams", teamCode);

    await setDoc(
      teamRef,
      {
        proLive: isProLive,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`🚀 Public team ${teamCode} proLive tier set to:`, isProLive);
  } catch (error) {
    console.error("❌ Failed to update public team live tier status:", error);
  }
}

/**
 * Saves a fixture snapshot into publicTeams/{teamCode}/fixtures/{fixtureId}
 */
export async function saveLiveFixture(teamId: string, fixture: any) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for saveLiveFixture: liveConfigured is false.`,
    );
    return;
  }
  //const teamCode = `TEAM-${teamId.toUpperCase()}`;
  const teamCode = getTeamCode(teamId);

  const ref = doc(db, "publicTeams", teamCode, "fixtures", fixture.id);

  await setDoc(ref, {
    ...cleanForFirestore(fixture),
    updatedAt: serverTimestamp(),
  });

  console.log("📡 Live fixture saved:", teamCode, fixture.id);
}

export async function deletePublicFixture(teamId: string, fixtureId: string) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for deletePublicFixture: liveConfigured is false.`,
    );
    return;
  }
  const teamCode = `TEAM-${teamId.toUpperCase()}`;

  const ref = doc(db, "publicTeams", teamCode, "fixtures", fixtureId);

  await deleteDoc(ref);

  console.log("🗑️ Deleted public fixture:", teamCode, fixtureId);
}

export async function ensurePublicTeamExists(team: Team) {
  if (!isLiveConfigured()) return;

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.log("ℹ️ Local play: ensurePublicTeamExists skipped (no user).");
    return null;
  }

  const teamCode = `TEAM-${team.id.toUpperCase()}`;
  const teamRef = doc(db, "publicTeams", teamCode);

  const isProLiveActive = useLiveStore.getState().livePro ?? false;

  const snap = await getDoc(teamRef);

  if (!snap.exists()) {
    // 🔥 Only create if missing
    await setDoc(teamRef, {
      ownerId: userId,
      teamId: team.id,
      teamName: team.name,
      teamCode,
      createdAt: serverTimestamp(),
      proLive: isProLiveActive,
    });

    console.log("🆕 Created public team:", teamCode);
  } else {
    console.log("✅ Public team already exists:", teamCode);
  }

  return teamCode;
}

export async function addLiveEvent(teamId: string, event: any) {
  if (!isLiveConfigured()) {
    console.log(`⚠️ Sync skipped for addLiveEvent: liveConfigured is false.`);
    return;
  }

  // 🔐 Prevent logged-out users from syncing balls/events
  if (!auth.currentUser?.uid) return;

  const teamCode = getTeamCode(teamId);

  const ref = doc(db, "publicTeams", teamCode, "live", event.id);

  await setDoc(
    ref,
    removeUndefined({
      ...event,
      teamId,
      teamCode,
      createdAt: serverTimestamp(),
    }),
    { merge: true },
  );
}

/*
export async function deleteLiveEvent(teamId: string, eventId: string) {
  const teamCode = getTeamCode(teamId);

  const ref = doc(db, "publicTeams", teamCode, "live", eventId);

  await deleteDoc(ref);

  console.log("🗑️ Deleted live event:", teamCode, eventId);
}
*/

/**
 * Core helper to delete multiple document IDs under a specific subcollection
 */
async function deleteDocumentsFromCollection(
  teamCode: string,
  subCollection: "live" | "liveData",
  documentIds: string[],
): Promise<void> {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for deleteDocumentsFromCollection: liveConfigured is false.`,
    );
    return;
  }
  const deletePromises = documentIds.map(async (docId) => {
    const ref = doc(db, "publicTeams", teamCode, subCollection, docId);
    await deleteDoc(ref);
    console.log(`🗑️ Deleted from ${subCollection}:`, teamCode, docId);
  });

  await Promise.all(deletePromises);
}

/**
 * Deletes a single specific live event from publicTeams/{teamCode}/live/{eventId}
 */
export async function deleteLiveEvent(
  teamId: string,
  eventId: string,
): Promise<void> {
  const teamCode = getTeamCode(teamId);
  await deleteDocumentsFromCollection(teamCode, "live", [eventId]);
}

/**
 * Cleans up all game data from publicTeams/{teamCode}/liveData/
 */
export async function endFixtureCleanUp(teamCode: string): Promise<void> {
  const nodesToClear = ["currentFixture", "currentGame", "currentBaseRuns"];
  await deleteDocumentsFromCollection(teamCode, "liveData", nodesToClear);
}

export const updateLiveData = (teamId: string, data: any) =>
  writeLiveData(teamId, "currentFixture", data);

export const updateCurrentGameData = (teamId: string, data: any) =>
  writeLiveData(teamId, "currentGame", data);

export const updatebaseRunsData = (teamId: string, data: any) =>
  writeLiveData(teamId, "currentBaseRuns", data);

export async function updatePublicTeamData(parentTeamId: string, team: Team) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for updatePublicTeamData: liveConfigured is false.`,
    );
    return;
  }

  // 🔐 1. Prevent logged-out users from making Firebase calls
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.log("ℹ️ Local play: updatePublicTeamData skipped (no user).");
    return;
  }
  const teamCode = getTeamCode(parentTeamId);

  if (!teamCode) {
    console.error(
      "❌ Cannot sync! Derived teamCode is empty for parent ID:",
      parentTeamId,
    );
    return;
  }

  await ensurePublicTeamExists(team);

  const ref = doc(db, "publicTeams", teamCode, "teams", team.id);

  // 1. Build the base payload that always syncs
  const updateData: any = {
    teamId: team.id,
    teamName: team.name,
    updatedAt: serverTimestamp(),
  };

  // 2. Only include players if the current state actually has them.
  // This prevents ballcounter mode ([]) from erasing existing DB data.
  if (team.players && team.players.length > 0) {
    updateData.players = team.players.map((p) => ({
      id: p.id,
      name: p.name,
      archived: p.archived ?? false,
    }));
  }

  // 3. Merge safely. If updateData.players is missing, the DB version is untouched.
  await setDoc(ref, updateData, { merge: true });

  console.log(
    "📡 Team synced smoothly:",
    team.name,
    "under host code →",
    teamCode,
  );
}

export async function syncLiveGame(teamId: string, game: any) {
  if (!isLiveConfigured()) {
    console.log(`⚠️ Sync skipped for syncLiveGame: liveConfigured is false.`);
    return;
  }

  // 🔐 Prevent logged-out users from live syncing game updates
  if (!auth.currentUser?.uid) return;

  const teamCode = getTeamCode(teamId);

  const gameData = cleanForFirestore(stripVolatileFields(game));
  const hash = JSON.stringify(gameData);

  // 🚫 skip if nothing changed
  if (hash === lastSyncHash) {
    console.log("⏭️ Skipping live sync (no changes)");
    return;
  }

  lastSyncHash = hash;

  const ref = doc(db, "publicTeams", teamCode, "liveData", "currentFixture");

  await setDoc(
    ref,
    {
      ...gameData,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  console.log("🔄 Live game synced:", teamCode);
}

/** Loads last season from Firestore */
export async function loadSeason(): Promise<string | null> {
  if (!auth.currentUser) return null;

  const userId = auth.currentUser.uid;
  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) return null;

  return userSnap.data()?.lastSeason ?? null;
}

export async function loadLiveViewTeams(teamId: string) {
  if (!isLiveConfigured()) {
    console.log(
      `⚠️ Sync skipped for loadLiveViewTeams: liveConfigured is false.`,
    );
    return;
  }
  const teamCode = getTeamCode(teamId);

  const snapshot = await getDocs(
    collection(db, "publicTeams", teamCode, "teams"),
  );

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      teamId: data.teamId,
      teamName: data.teamName,
      players: data.players ?? [],
    };
  });
}

/**
 * Initializes all 3 core liveData tracking templates in parallel
 * to ensure resume states never fail validation screens.
 */
export async function initializeLiveTracking(teamId: string, fixture: Fixture) {
  try {
    const teamCode = getTeamCode(teamId);
    if (!teamCode) return;

    // 1. Core fixture layout config
    await updateLiveData(teamId, fixture);

    // 2. Core running stats state model
    const defaultGamePlaceholder = {
      id: fixture.id,
      fixtureId: fixture.id,
      mode: fixture.mode || "scorebook",
      completed: false,
      totalRuns: 0,
      totalBalls: 0,
      wickets: [],
      overs: fixture.overs || 20,
      yourTeam: fixture.yourTeam,
      oppositionTeam: fixture.oppositionTeam,
    };
    await updateCurrentGameData(teamId, defaultGamePlaceholder);

    // 3. Simple run counter block
    await updatebaseRunsData(teamId, { runs: 0 });

    console.log(
      `🚀 Live documents initialized smoothly for team code: ${teamCode}`,
    );
  } catch (error) {
    console.error(
      "❌ Failed to run cloud live initialization sequence:",
      error,
    );
  }
}

export async function updateSyncControl(
  teamId: string,
  events: any[],
  isGameComplete: boolean = false,
) {
  // 🔐 Prevent logged-out users from hitting Firebase
  if (!auth.currentUser?.uid) return;

  try {
    const teamCode = getTeamCode(teamId);
    const ref = doc(db, "publicTeams", teamCode, "liveData", "syncControl");

    // 1. Calculate valid legal balls bowled to determine current over count
    const legalBallsCount = events.filter((e) => e.countsAsBall).length;
    const completedOvers = Math.floor(legalBallsCount / 6);
    const ballsInOver = legalBallsCount % 6;
    const overString = `${completedOvers}.${ballsInOver}`; // e.g., 4.2 overs

    // 2. Derive score calculations
    // (Assuming simple total runs sum; adjust if you track multiple innings)
    const totalRunsScored = events.reduce((sum, e) => sum + (e.runs || 0), 0);

    await setDoc(
      ref,
      {
        completedOvers, // Integer used for our % 2 throttling (e.g., 2, 4, 6)
        overDisplay: overString,
        totalRuns: totalRunsScored,
        isCompleted: isGameComplete,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log(
      `📡 Sync Control Updated: Over ${overString}, Runs: ${totalRunsScored}`,
    );
  } catch (error) {
    console.error("❌ Failed to update sync control document:", error);
  }
}

export { mergeById };
