import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import utilities
import { validateEnv } from './utils/validateEnv';
import { initializeDatabase, isDatabaseInitialized } from './utils/db';
import { runMigrations } from './migrations/init';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import analyticsRoutes from './routes/analytics';
import exportRoutes from './routes/export';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
const env = validateEnv();

const app = express();
const PORT = parseInt(env.PORT);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: env.DB_TYPE,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting Expense Tracker server...');
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Database: ${env.DB_TYPE}`);
    
    // Initialize database
    initializeDatabase();
    
    // Run migrations if needed
    if (!isDatabaseInitialized() || env.NODE_ENV === 'development') {
      console.log('Running database migrations...');
      await runMigrations();
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Client URL: ${env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();