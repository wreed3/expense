import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database as DatabaseType } from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let sqliteDb: DatabaseType | null = null;
let pgPool: Pool | null = null;

interface QueryResult {
  rows?: any[];
  lastInsertRowid?: number;
  changes?: number;
}

export function initDatabase(): void {
  if (DB_TYPE === 'postgres') {
    pgPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'expense_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('Connected to PostgreSQL database');
  } else {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../expenses.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    console.log('Connected to SQLite database');
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (DB_TYPE === 'postgres' && pgPool) {
    const result = await pgPool.query(sql, params);
    return result.rows as T[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const rows = stmt.all(...params) as T[];
    return rows;
  }
  throw new Error('Database not initialized');
}

export async function run(sql: string, params: any[] = []): Promise<QueryResult> {
  if (DB_TYPE === 'postgres' && pgPool) {
    const result = await pgPool.query(sql, params);
    return {
      rows: result.rows,
      changes: result.rowCount || 0,
    };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const info = stmt.run(...params);
    return {
      lastInsertRowid: Number(info.lastInsertRowid),
      changes: info.changes,
    };
  }
  throw new Error('Database not initialized');
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (DB_TYPE === 'postgres' && pgPool) {
    const result = await pgPool.query(sql, params);
    return result.rows[0] as T | undefined;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }
  throw new Error('Database not initialized');
}

export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
}