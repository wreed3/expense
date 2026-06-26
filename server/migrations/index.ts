import { initializeDatabase } from '../database/index.js';
import { logger } from '../utils/logger.js';

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    await initializeDatabase();
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();