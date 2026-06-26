import Database from 'better-sqlite3';
import { Pool } from 'pg';

const DB_TYPE = (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres';

let db: Database.Database | Pool;

if (DB_TYPE === 'postgres') {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'expense_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  db = pool;
} else {
  const sqlite = new Database(process.env.DB_PATH || './expenses.db');
  sqlite.pragma('journal_mode = WAL');
  db = sqlite;
}

export const getDb = () => db;

export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (DB_TYPE === 'postgres') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).all(...params);
  }
};

export const run = async (sql: string, params: any[] = []): Promise<any> => {
  if (DB_TYPE === 'postgres') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return result;
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).run(...params);
  }
};

export const get = async (sql: string, params: any[] = []): Promise<any> => {
  if (DB_TYPE === 'postgres') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return result.rows[0];
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).get(...params);
  }
};

export const close = () => {
  if (DB_TYPE === 'postgres') {
    const pool = db as Pool;
    pool.end();
  } else {
    const sqlite = db as Database.Database;
    sqlite.close();
  }
};

// Helper to check if we're using SQLite
export const isSQLite = () => DB_TYPE === 'sqlite';

// Helper to check if we're using PostgreSQL
export const isPostgres = () => DB_TYPE === 'postgres';

// Export the database type for type checking
export type DbType = typeof DB_TYPE;

// Transaction support
export const transaction = async (callback: () => Promise<void>) => {
  if (DB_TYPE === 'postgres') {
    const pool = db as Pool;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await callback();
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const sqlite = db as Database.Database;
    sqlite.prepare('BEGIN').run();
    try {
      await callback();
      sqlite.prepare('COMMIT').run();
    } catch (error) {
      sqlite.prepare('ROLLBACK').run();
      throw error;
    }
  }
};