import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import winston from 'winston';

// Routes
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/export';
import currencyRoutes from './routes/currencies';
import tagRoutes from './routes/tags';
import customFieldRoutes from './routes/custom-fields';
import analyticsAdvancedRoutes from './routes/analytics-advanced';
import importExportRoutes from './routes/import-export';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const dbPath = process.env.DB_PATH || join(__dirname, '../expenses.db');
const dbDir = dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  logger.info('Database connected successfully');
} catch (error) {
  logger.error('Failed to connect to database:', error);
  process.exit(1);
}

export function getDb() {
  return db;
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics-advanced', analyticsAdvancedRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/import-export', importExportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  db.close();
  process.exit(0);
});