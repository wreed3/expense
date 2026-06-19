import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  dbType: z.enum(['sqlite', 'postgres']).default('sqlite'),
  dbPath: z.string().default('./expenses.db'),
  dbHost: z.string().optional(),
  dbPort: z.number().optional(),
  dbName: z.string().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),
  uploadDir: z.string().default('./uploads'),
  maxFileSize: z.number().default(5 * 1024 * 1024),
  rateLimitWindowMs: z.number().default(15 * 60 * 1000),
  rateLimitMaxRequests: z.number().default(100),
  clientUrl: z.string().default('http://localhost:3000'),
});

export const config = configSchema.parse({
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV,
  dbType: process.env.DB_TYPE,
  dbPath: process.env.DB_PATH,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-minimum-32-characters-long-please',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  uploadDir: process.env.UPLOAD_DIR,
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : undefined,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : undefined,
  clientUrl: process.env.CLIENT_URL,
});