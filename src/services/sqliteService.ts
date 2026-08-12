import * as SQLite from "expo-sqlite";

import type { Fixture } from "../state/fixtureStore";

const DB_NAME = "cricket-fixtures.db";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

function rowToFixture(row: { fixture_data: string }): Fixture {
  const fixture = JSON.parse(row.fixture_data) as Fixture;
  return {
    ...fixture,
    innings: Array.isArray(fixture.innings) ? fixture.innings : [],
  };
}

export async function initDB(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS fixtures (
        id TEXT PRIMARY KEY NOT NULL,
        date INTEGER NOT NULL,
        season TEXT,
        completed INTEGER NOT NULL,
        fixture_data TEXT NOT NULL
      );
    `);
  })();

  return initPromise;
}

function getDB(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return db;
}

export async function saveFixture(fixture: Fixture): Promise<void> {
  await initDB();
  await getDB().runAsync(
    `INSERT OR REPLACE INTO fixtures (id, date, season, completed, fixture_data)
     VALUES (?, ?, ?, ?, ?)`,
    fixture.id,
    fixture.date,
    fixture.season ?? null,
    fixture.completed ? 1 : 0,
    JSON.stringify(fixture),
  );
}

export async function saveMultipleFixtures(fixtures: Fixture[]): Promise<void> {
  if (fixtures.length === 0) return;

  await initDB();
  const database = getDB();

  await database.withTransactionAsync(async () => {
    const statement = await database.prepareAsync(
      `INSERT OR REPLACE INTO fixtures (id, date, season, completed, fixture_data)
       VALUES (?, ?, ?, ?, ?)`,
    );

    try {
      for (const fixture of fixtures) {
        await statement.executeAsync([
          fixture.id,
          fixture.date,
          fixture.season ?? null,
          fixture.completed ? 1 : 0,
          JSON.stringify(fixture),
        ]);
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
}

export async function getAllFixtures(): Promise<Fixture[]> {
  await initDB();
  const rows = await getDB().getAllAsync<{ fixture_data: string }>(
    "SELECT fixture_data FROM fixtures ORDER BY date DESC",
  );
  return rows.map(rowToFixture);
}

export async function getFixtureById(id: string): Promise<Fixture | null> {
  await initDB();
  const row = await getDB().getFirstAsync<{ fixture_data: string }>(
    "SELECT fixture_data FROM fixtures WHERE id = ?",
    id,
  );
  return row ? rowToFixture(row) : null;
}

export async function deleteFixtureFromDB(id: string): Promise<void> {
  await initDB();
  await getDB().runAsync("DELETE FROM fixtures WHERE id = ?", id);
}

export async function clearAllFixturesFromDB(): Promise<void> {
  await initDB();
  await getDB().runAsync("DELETE FROM fixtures");
}
