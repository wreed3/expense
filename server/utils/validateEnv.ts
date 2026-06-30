import { logger } from './logger.js';

export const validateEnv = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Warn about default values
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars') {
    logger.warn('WARNING: Using default JWT_SECRET. Change this in production!');
  }

  logger.info('Environment variables validated');
};