import type { Database } from 'better-sqlite3';
import type { Pool } from 'pg';

type DatabaseConnection = Database | Pool;

export async function up(db: DatabaseConnection): Promise<void> {
  const isPostgres = 'query' in db;

  if (isPostgres) {
    const pool = db as Pool;
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )
    `);

    // Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        date DATE NOT NULL,
        receipt_path VARCHAR(255),
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_frequency VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Budgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id, month)
      )
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)');
  } else {
    const sqlite = db as Database;

    // Users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      )
    `);

    // Expenses table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        receipt_path TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);

    // Budgets table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE(user_id, category_id, month)
      )
    `);

    // Create indexes
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)');
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id)');
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)');
  }
}

export async function down(db: DatabaseConnection): Promise<void> {
  const isPostgres = 'query' in db;

  if (isPostgres) {
    const pool = db as Pool;
    await pool.query('DROP TABLE IF EXISTS budgets');
    await pool.query('DROP TABLE IF EXISTS expenses');
    await pool.query('DROP TABLE IF EXISTS categories');
    await pool.query('DROP TABLE IF EXISTS users');
  } else {
    const sqlite = db as Database;
    sqlite.exec('DROP TABLE IF EXISTS budgets');
    sqlite.exec('DROP TABLE IF EXISTS expenses');
    sqlite.exec('DROP TABLE IF EXISTS categories');
    sqlite.exec('DROP TABLE IF EXISTS users');
  }
}