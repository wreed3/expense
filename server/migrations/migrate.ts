import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DatabaseConnection = Database.Database | Pool;

interface Migration {
  up: (db: DatabaseConnection) => Promise<void>;
  down: (db: DatabaseConnection) => Promise<void>;
}

async function runMigrations(): Promise<void> {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  let db: DatabaseConnection;

  // Initialize database connection
  if (DB_TYPE === 'postgres') {
    db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'expense_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('Connected to PostgreSQL database');
  } else {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../expenses.db');
    db = new Database(dbPath);
    (db as Database.Database).pragma('journal_mode = WAL');
    console.log('Connected to SQLite database');
  }

  try {
    // Get all migration files
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter((file: string) => file.match(/^\d{3}_.*\.ts$/) || file.match(/^\d{3}_.*\.js$/))
      .sort();

    console.log(`Found ${migrationFiles.length} migration(s)`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(__dirname, file);
      const migration = (await import(migrationPath)) as Migration;

      await migration.up(db);
      console.log(`✓ Migration ${file} completed`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if ('close' in db) {
      (db as Database.Database).close();
    } else {
      await (db as Pool).end();
    }
  }
}

runMigrations();