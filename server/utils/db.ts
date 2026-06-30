import Database from 'better-sqlite3';
import { logger } from './logger.js';
import { runMigrations } from '../migrations/init.js';

let db: Database.Database | null = null;

export const initDatabase = async () => {
  if (db) {
    return db;
  }

  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'sqlite') {
    const dbPath = process.env.DB_PATH || './expenses.db';
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    logger.info(`Connected to SQLite database: ${dbPath}`);
    
    // Run migrations
    await runMigrations(db);
    
    return db;
  } else {
    throw new Error('PostgreSQL support not yet implemented');
  }
};

export const getDb = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
};