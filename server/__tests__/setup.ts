import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Test database path
const TEST_DB_PATH = join(process.cwd(), 'test-expenses.db');

// Global test database instance
let testDb: Database.Database;

/**
 * Setup test database before all tests
 */
beforeAll(() => {
  // Remove existing test database
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  // Create test database
  testDb = new Database(TEST_DB_PATH);

  // Create tables
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date DATE NOT NULL,
      receipt_path TEXT,
      is_recurring BOOLEAN DEFAULT 0,
      recurring_frequency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      alert_threshold REAL DEFAULT 0.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(user_id, category_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
  `);

  // Set environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_PATH = TEST_DB_PATH;
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRES_IN = '1h';
});

/**
 * Clean up test database after all tests
 */
afterAll(() => {
  if (testDb) {
    testDb.close();
  }
  
  // Remove test database file
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
});

/**
 * Clear all tables before each test
 */
beforeEach(() => {
  if (testDb) {
    testDb.exec(`
      DELETE FROM expenses;
      DELETE FROM budgets;
      DELETE FROM categories;
      DELETE FROM users;
    `);
  }
});

/**
 * Export test database for use in tests
 */
export { testDb, TEST_DB_PATH };