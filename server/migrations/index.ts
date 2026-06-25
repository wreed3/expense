import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

export async function runMigrations(db: Database.Database) {
  console.log('Starting migrations...');

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get list of migration files
  const migrationFiles = fs.readdirSync(__dirname)
    .filter(file => file.match(/^\d{3}_.*\.ts$/) || file.match(/^\d{3}_.*\.js$/))
    .sort();

  // Get executed migrations
  const executedMigrations = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  const executedNames = new Set(executedMigrations.map(m => m.name));

  let migrationsRun = 0;

  for (const file of migrationFiles) {
    const migrationName = file.replace(/\.(ts|js)$/, '');
    
    if (executedNames.has(migrationName)) {
      console.log(`✓ Migration ${migrationName} already executed`);
      continue;
    }

    console.log(`Running migration: ${migrationName}...`);

    try {
      const migrationPath = path.join(__dirname, file);
      const migration = await import(migrationPath);

      db.prepare('BEGIN TRANSACTION').run();

      try {
        migration.up(db);
        
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
        
        db.prepare('COMMIT').run();
        
        console.log(`✓ Migration ${migrationName} completed successfully`);
        migrationsRun++;
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error(`✗ Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  if (migrationsRun === 0) {
    console.log('No new migrations to run. Database is up to date.');
  } else {
    console.log(`Successfully ran ${migrationsRun} migration(s).`);
  }
}

export async function rollbackMigration(db: Database.Database, migrationName?: string) {
  if (!migrationName) {
    // Rollback last migration
    const lastMigration = db.prepare('SELECT name FROM migrations ORDER BY id DESC LIMIT 1').get() as { name: string } | undefined;
    
    if (!lastMigration) {
      console.log('No migrations to rollback');
      return;
    }
    
    migrationName = lastMigration.name;
  }

  console.log(`Rolling back migration: ${migrationName}...`);

  try {
    const migrationFile = `${migrationName}.ts`;
    const migrationPath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    const migration = await import(migrationPath);

    db.prepare('BEGIN TRANSACTION').run();

    try {
      migration.down(db);
      
      db.prepare('DELETE FROM migrations WHERE name = ?').run(migrationName);
      
      db.prepare('COMMIT').run();
      
      console.log(`✓ Migration ${migrationName} rolled back successfully`);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error(`✗ Rollback of ${migrationName} failed:`, error);
    throw error;
  }
}