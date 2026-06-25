import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { runMigrations, rollbackMigration } from './migrations/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const command = process.argv[2];
const migrationName = process.argv[3];

async function main() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../expenses.db');
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    switch (command) {
      case 'up':
      case undefined:
        await runMigrations(db);
        break;
      
      case 'down':
        await rollbackMigration(db, migrationName);
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: npm run migrate [up|down] [migration-name]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();