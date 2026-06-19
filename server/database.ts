import Database from 'better-sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
  theme: string;
}

export interface Expense {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  category_id: number;
  date: string;
  created_at: string;
  receipt_path?: string;
  notes?: string;
}

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  color: string;
  icon: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  alert_threshold: number;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
}

export interface ExpenseTag {
  expense_id: number;
  tag_id: number;
}

export interface RecurringExpense {
  id: number;
  user_id: number;
  description: string;
  amount: number;
  category_id: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  last_created: string;
  is_active: boolean;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;
  private pool: pkg.Pool | null = null;
  private dbType: 'sqlite' | 'postgres';

  private constructor() {
    this.dbType = config.dbType;
    this.initialize();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initialize() {
    if (this.dbType === 'sqlite') {
      this.db = new Database(join(__dirname, '..', config.dbPath));
      logger.info('SQLite database initialized');
    } else {
      this.pool = new Pool({
        host: config.dbHost,
        port: config.dbPort,
        database: config.dbName,
        user: config.dbUser,
        password: config.dbPassword,
      });
      logger.info('PostgreSQL connection pool initialized');
    }
  }

  getDb(): Database.Database {
    if (!this.db) throw new Error('SQLite not initialized');
    return this.db;
  }

  getPool(): pkg.Pool {
    if (!this.pool) throw new Error('PostgreSQL not initialized');
    return this.pool;
  }

  getType(): 'sqlite' | 'postgres' {
    return this.dbType;
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (this.dbType === 'sqlite') {
      return this.db!.prepare(sql).all(...params);
    } else {
      const result = await this.pool!.query(sql, params);
      return result.rows;
    }
  }

  async queryOne(sql: string, params: any[] = []): Promise<any> {
    if (this.dbType === 'sqlite') {
      return this.db!.prepare(sql).get(...params);
    } else {
      const result = await this.pool!.query(sql, params);
      return result.rows[0];
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (this.dbType === 'sqlite') {
      return this.db!.prepare(sql).run(...params);
    } else {
      return await this.pool!.query(sql, params);
    }
  }
}

export const db = DatabaseManager.getInstance();