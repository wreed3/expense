import Database from 'better-sqlite3';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let db: Database.Database | Pool;

export function initializeDatabase() {
  if (DB_TYPE === 'postgres') {
    db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'expense_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('Connected to PostgreSQL database');
  } else {
    const dbPath = process.env.DB_PATH || './expenses.db';
    const dbDir = path.dirname(dbPath);
    
    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('Connected to SQLite database');
  }
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    if (DB_TYPE === 'postgres') {
      await (db as Pool).end();
    } else {
      (db as Database.Database).close();
    }
  }
}

export function isDatabaseInitialized(): boolean {
  if (DB_TYPE === 'sqlite') {
    const dbPath = process.env.DB_PATH || './expenses.db';
    return fs.existsSync(dbPath);
  }
  return true; // For PostgreSQL, assume it's initialized
}