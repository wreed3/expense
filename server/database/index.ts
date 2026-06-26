import Database from 'better-sqlite3';
import logger from '../utils/logger.js';
import { dbConfig } from '../config.js';
import type { Expense, Category, Budget, User } from '../../src/types/index.js';

let db: Database.Database;

export function initializeDatabase() {
  if (dbConfig.type === 'sqlite') {
    db = new Database(dbConfig.path);
    db.pragma('journal_mode = WAL');
    logger.info('SQLite database initialized');
  } else {
    throw new Error('PostgreSQL not yet implemented');
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// User operations
export function createUser(email: string, password: string, name: string): User {
  const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
  const result = stmt.run(email, password, name);
  return getUserById(result.lastInsertRowid as number)!;
}

export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

// Expense operations
export function getExpenses(userId: number): Expense[] {
  const stmt = db.prepare(`
    SELECT e.*, c.name as categoryName, c.color as categoryColor
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
    ORDER BY e.date DESC
  `);
  return stmt.all(userId) as Expense[];
}

export function createExpense(expense: Omit<Expense, 'id'>): Expense {
  const stmt = db.prepare(`
    INSERT INTO expenses (user_id, amount, category_id, description, date, receipt_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    expense.userId,
    expense.amount,
    expense.categoryId,
    expense.description,
    expense.date,
    expense.receiptPath || null
  );
  return getExpenseById(result.lastInsertRowid as number)!;
}

export function getExpenseById(id: number): Expense | undefined {
  const stmt = db.prepare(`
    SELECT e.*, c.name as categoryName, c.color as categoryColor
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `);
  return stmt.get(id) as Expense | undefined;
}

export function updateExpense(id: number, expense: Partial<Expense>): Expense | undefined {
  const updates: string[] = [];
  const values: any[] = [];

  if (expense.amount !== undefined) {
    updates.push('amount = ?');
    values.push(expense.amount);
  }
  if (expense.categoryId !== undefined) {
    updates.push('category_id = ?');
    values.push(expense.categoryId);
  }
  if (expense.description !== undefined) {
    updates.push('description = ?');
    values.push(expense.description);
  }
  if (expense.date !== undefined) {
    updates.push('date = ?');
    values.push(expense.date);
  }
  if (expense.receiptPath !== undefined) {
    updates.push('receipt_path = ?');
    values.push(expense.receiptPath);
  }

  if (updates.length === 0) {
    return getExpenseById(id);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getExpenseById(id);
}

export function deleteExpense(id: number): void {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  stmt.run(id);
}

// Category operations
export function getCategories(userId: number): Category[] {
  const stmt = db.prepare('SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name');
  return stmt.all(userId) as Category[];
}

export function createCategory(category: Omit<Category, 'id'>): Category {
  const stmt = db.prepare('INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)');
  const result = stmt.run(category.userId, category.name, category.color, category.icon || null);
  return getCategoryById(result.lastInsertRowid as number)!;
}

export function getCategoryById(id: number): Category | undefined {
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  return stmt.get(id) as Category | undefined;
}

export function updateCategory(id: number, category: Partial<Category>): Category | undefined {
  const updates: string[] = [];
  const values: any[] = [];

  if (category.name !== undefined) {
    updates.push('name = ?');
    values.push(category.name);
  }
  if (category.color !== undefined) {
    updates.push('color = ?');
    values.push(category.color);
  }
  if (category.icon !== undefined) {
    updates.push('icon = ?');
    values.push(category.icon);
  }

  if (updates.length === 0) {
    return getCategoryById(id);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getCategoryById(id);
}

export function deleteCategory(id: number): void {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  stmt.run(id);
}

// Budget operations
export function getBudgets(userId: number): Budget[] {
  const stmt = db.prepare(`
    SELECT b.*, c.name as categoryName
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
  `);
  return stmt.all(userId) as Budget[];
}

export function createBudget(budget: Omit<Budget, 'id'>): Budget {
  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, category_id, amount, period, start_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    budget.userId,
    budget.categoryId,
    budget.amount,
    budget.period,
    budget.startDate
  );
  return getBudgetById(result.lastInsertRowid as number)!;
}

export function getBudgetById(id: number): Budget | undefined {
  const stmt = db.prepare(`
    SELECT b.*, c.name as categoryName
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `);
  return stmt.get(id) as Budget | undefined;
}

export function updateBudget(id: number, budget: Partial<Budget>): Budget | undefined {
  const updates: string[] = [];
  const values: any[] = [];

  if (budget.amount !== undefined) {
    updates.push('amount = ?');
    values.push(budget.amount);
  }
  if (budget.period !== undefined) {
    updates.push('period = ?');
    values.push(budget.period);
  }
  if (budget.startDate !== undefined) {
    updates.push('start_date = ?');
    values.push(budget.startDate);
  }

  if (updates.length === 0) {
    return getBudgetById(id);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getBudgetById(id);
}

export function deleteBudget(id: number): void {
  const stmt = db.prepare('DELETE FROM budgets WHERE id = ?');
  stmt.run(id);
}