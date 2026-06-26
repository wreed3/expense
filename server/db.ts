import Database from 'better-sqlite3';
import { join } from 'path';

let db: Database.Database;

export function initDb() {
  const dbPath = process.env.DB_PATH || join(process.cwd(), 'expenses.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
  }
}