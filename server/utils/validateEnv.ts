import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_TYPE: z.enum(['sqlite', 'postgres']).default('sqlite'),
  DB_PATH: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional validation for database configuration
    if (env.DB_TYPE === 'postgres') {
      if (!env.DB_HOST || !env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD) {
        throw new Error('PostgreSQL requires DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD to be set');
      }
    } else {
      if (!env.DB_PATH) {
        console.warn('DB_PATH not set, using default: ./expenses.db');
      }
    }
    
    // Ensure upload directory exists
    const uploadDir = env.UPLOAD_DIR;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }
    
    // Warn about weak JWT secret in production
    if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 64) {
      console.warn('WARNING: JWT_SECRET is weak. Use a strong random string in production.');
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Environment validation error:', error);
    }
    process.exit(1);
  }
}