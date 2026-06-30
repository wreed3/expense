import Database from 'better-sqlite3';
import { logger } from './logger.js';

let db: Database.Database | null = null;

export const initDb = (): Database.Database => {
  if (db) {
    return db;
  }

  const dbPath: string = process.env.DB_PATH || './expenses.db';
  
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    logger.info(`Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDb = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
};

export const closeDb = (): void => {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
};