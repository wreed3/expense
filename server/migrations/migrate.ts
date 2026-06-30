import { initDatabase } from '../utils/db.js';
import { logger } from '../utils/logger.js';

const runMigration = async () => {
  try {
    logger.info('Starting manual migration...');
    await initDatabase();
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();