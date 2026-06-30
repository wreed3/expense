import { logger } from './logger.js';

interface RequiredEnvVars {
  JWT_SECRET: string;
  PORT?: string;
  NODE_ENV?: string;
  DB_PATH?: string;
  UPLOAD_DIR?: string;
  MAX_FILE_SIZE?: string;
  CLIENT_URL?: string;
}

export const validateEnv = (): void => {
  const required: (keyof RequiredEnvVars)[] = ['JWT_SECRET'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters long for security');
  }

  logger.info('Environment variables validated successfully');
};