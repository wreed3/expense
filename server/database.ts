import Database from 'better-sqlite3';
import type { Pool } from 'pg';
import { dbConfig } from './config.js';
import logger from './utils/logger.js';

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

export function initDatabase() {
  if (dbConfig.type === 'sqlite') {
    sqliteDb = new Database(dbConfig.path);
    sqliteDb.pragma('journal_mode = WAL');
    logger.info(`SQLite database initialized at ${dbConfig.path}`);
  } else if (dbConfig.type === 'postgres') {
    // Note: pg module is optional dependency
    // Import dynamically to avoid errors when not installed
    import('pg').then(({ Pool }) => {
      pgPool = new Pool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
      });
      logger.info('PostgreSQL connection pool initialized');
    }).catch((err) => {
      logger.error('Failed to initialize PostgreSQL. Make sure pg is installed: npm install pg');
      throw err;
    });
  }
}

export function getDb(): Database.Database {
  if (!sqliteDb) {
    throw new Error('SQLite database not initialized');
  }
  return sqliteDb;
}

export function getPool(): Pool {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pgPool;
}

export function closeDb() {
  if (sqliteDb) {
    sqliteDb.close();
    logger.info('SQLite database closed');
  }
  if (pgPool) {
    pgPool.end();
    logger.info('PostgreSQL connection pool closed');
  }
}