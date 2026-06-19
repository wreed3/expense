import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category_id: number;
  date: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export class Database {
  private static instance: Database;
  private db: Database.Database;

  private constructor() {
    this.db = new Database(join(__dirname, '../expenses.db'));
    this.initialize();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initialize() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
    `);

    // Insert default categories if none exist
    const count = this.db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (count.count === 0) {
      const categories = [
        { name: 'Food & Dining', color: '#FF6B6B', icon: '🍔' },
        { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
        { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
        { name: 'Entertainment', color: '#FFA07A', icon: '🎬' },
        { name: 'Bills & Utilities', color: '#98D8C8', icon: '💡' },
        { name: 'Healthcare', color: '#F7DC6F', icon: '🏥' },
        { name: 'Other', color: '#B19CD9', icon: '📌' },
      ];

      const insert = this.db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
      for (const cat of categories) {
        insert.run(cat.name, cat.color, cat.icon);
      }
    }
  }

  getDb() {
    return this.db;
  }
}