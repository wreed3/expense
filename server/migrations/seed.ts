import { fileURLToPath } from 'url';
import path from 'path';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DatabaseConnection = Database.Database | Pool;

interface SeedUser {
  email: string;
  password: string;
  name: string;
}

interface SeedCategory {
  name: string;
  color: string;
  icon: string;
}

interface SeedExpense {
  amount: number;
  description: string;
  date: string;
  categoryIndex: number;
}

async function seedDatabase(): Promise<void> {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  let db: DatabaseConnection;
  const isPostgres = DB_TYPE === 'postgres';

  // Initialize database connection
  if (isPostgres) {
    db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'expense_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('Connected to PostgreSQL database');
  } else {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../expenses.db');
    db = new Database(dbPath);
    (db as Database.Database).pragma('journal_mode = WAL');
    console.log('Connected to SQLite database');
  }

  try {
    console.log('Starting database seed...');

    // Create demo user
    const demoUser: SeedUser = {
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
    };

    const hashedPassword = await bcrypt.hash(demoUser.password, 10);

    let userId: number;

    if (isPostgres) {
      const pool = db as Pool;
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
        [demoUser.email, hashedPassword, demoUser.name]
      );
      userId = result.rows[0].id;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
      const info = stmt.run(demoUser.email, hashedPassword, demoUser.name);
      userId = Number(info.lastInsertRowid);
    }

    console.log(`✓ Created demo user (ID: ${userId})`);

    // Create categories
    const categories: SeedCategory[] = [
      { name: 'Food & Dining', color: '#ef4444', icon: '🍔' },
      { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
      { name: 'Shopping', color: '#8b5cf6', icon: '🛍️' },
      { name: 'Entertainment', color: '#ec4899', icon: '🎬' },
      { name: 'Bills & Utilities', color: '#f59e0b', icon: '💡' },
      { name: 'Healthcare', color: '#10b981', icon: '🏥' },
    ];

    const categoryIds: number[] = [];

    for (const category of categories) {
      if (isPostgres) {
        const pool = db as Pool;
        const result = await pool.query(
          'INSERT INTO categories (user_id, name, color, icon) VALUES ($1, $2, $3, $4) RETURNING id',
          [userId, category.name, category.color, category.icon]
        );
        categoryIds.push(result.rows[0].id);
      } else {
        const sqlite = db as Database.Database;
        const stmt = sqlite.prepare(
          'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)'
        );
        const info = stmt.run(userId, category.name, category.color, category.icon);
        categoryIds.push(Number(info.lastInsertRowid));
      }
    }

    console.log(`✓ Created ${categories.length} categories`);

    // Create sample expenses
    const expenses: SeedExpense[] = [
      { amount: 45.50, description: 'Grocery shopping', date: '2024-01-15', categoryIndex: 0 },
      { amount: 12.00, description: 'Gas station', date: '2024-01-16', categoryIndex: 1 },
      { amount: 89.99, description: 'New shoes', date: '2024-01-17', categoryIndex: 2 },
      { amount: 25.00, description: 'Movie tickets', date: '2024-01-18', categoryIndex: 3 },
      { amount: 120.00, description: 'Electric bill', date: '2024-01-19', categoryIndex: 4 },
      { amount: 35.00, description: 'Pharmacy', date: '2024-01-20', categoryIndex: 5 },
    ];

    for (const expense of expenses) {
      const categoryId = categoryIds[expense.categoryIndex];
      if (isPostgres) {
        const pool = db as Pool;
        await pool.query(
          'INSERT INTO expenses (user_id, amount, description, category_id, date) VALUES ($1, $2, $3, $4, $5)',
          [userId, expense.amount, expense.description, categoryId, expense.date]
        );
      } else {
        const sqlite = db as Database.Database;
        const stmt = sqlite.prepare(
          'INSERT INTO expenses (user_id, amount, description, category_id, date) VALUES (?, ?, ?, ?, ?)'
        );
        stmt.run(userId, expense.amount, expense.description, categoryId, expense.date);
      }
    }

    console.log(`✓ Created ${expenses.length} sample expenses`);
    console.log('\nDatabase seeded successfully!');
    console.log(`\nDemo credentials:\nEmail: ${demoUser.email}\nPassword: ${demoUser.password}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if ('close' in db) {
      (db as Database.Database).close();
    } else {
      await (db as Pool).end();
    }
  }
}

seedDatabase();